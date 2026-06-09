const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

// ─── APPLY LEAVE (Employee) ───────────────────────────
router.post("/apply", auth, async (req, res) => {
  try {
    const { leave_type_id, from_date, to_date, reason } = req.body;
    const employee_id = req.user.id;

    // Calculate total days
    const from = new Date(from_date);
    const to = new Date(to_date);
    const total_days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    if (total_days <= 0) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    // Check leave balance
    const balance = await pool.query(
      "SELECT * FROM leave_balance WHERE employee_id=$1 AND leave_type_id=$2",
      [employee_id, leave_type_id],
    );

    if (
      balance.rows.length === 0 ||
      balance.rows[0].available_days < total_days
    ) {
      return res.status(400).json({ message: "Insufficient leave balance" });
    }

    // Insert leave application
    const result = await pool.query(
      `INSERT INTO leave_applications(employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
       VALUES($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
      [employee_id, leave_type_id, from_date, to_date, total_days, reason],
    );

    res.status(201).json({
      message: "Leave applied successfully",
      leave: result.rows[0],
    });
  } catch (error) {
    console.log("APPLY LEAVE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── GET MY LEAVES (Employee) ─────────────────────────
router.get("/my-leaves", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        la.id,
        lt.leave_name,
        la.from_date,
        la.to_date,
        la.total_days,
        la.reason,
        la.status,
        la.created_at
       FROM leave_applications la
       INNER JOIN leave_types lt ON la.leave_type_id = lt.id
       WHERE la.employee_id = $1
       ORDER BY la.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ALL LEAVES (Manager/HR/Admin) ───────────────
router.get("/all", auth, role("manager", "hr", "admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        la.id,
        u.name AS employee_name,
        u.email,
        lt.leave_name,
        la.from_date,
        la.to_date,
        la.total_days,
        la.reason,
        la.status,
        la.created_at
       FROM leave_applications la
       INNER JOIN users u ON la.employee_id = u.id
       INNER JOIN leave_types lt ON la.leave_type_id = lt.id
       ORDER BY la.created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── APPROVE / REJECT LEAVE (Manager/HR/Admin) ───────
router.put(
  "/action/:id",
  auth,
  role("manager", "hr", "admin"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { action, remarks } = req.body; // action: 'approved' or 'rejected'

      await client.query("BEGIN");

      // Get leave application
      const leave = await client.query(
        "SELECT * FROM leave_applications WHERE id=$1",
        [id],
      );

      if (leave.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Leave not found" });
      }

      if (leave.rows[0].status !== "pending") {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Leave already processed" });
      }

      // Update leave status
      await client.query(
        "UPDATE leave_applications SET status=$1 WHERE id=$2",
        [action, id],
      );

      // If approved → deduct from leave balance
      if (action === "approved") {
        await client.query(
          `UPDATE leave_balance
         SET available_days = available_days - $1
         WHERE employee_id=$2 AND leave_type_id=$3`,
          [
            leave.rows[0].total_days,
            leave.rows[0].employee_id,
            leave.rows[0].leave_type_id,
          ],
        );
      }

      // Insert audit log
      await client.query(
        `INSERT INTO approval_history(leave_id, approved_by, action, remarks)
       VALUES($1,$2,$3,$4)`,
        [id, req.user.id, action, remarks],
      );

      // Send notification to employee
      if (action === "approved") {
        await client.query(
          `INSERT INTO notifications(user_id, title, message)
     VALUES($1,$2,$3)`,
          [
            leave.rows[0].employee_id,
            "Leave Approved ✅",
            `Your leave from ${leave.rows[0].from_date} to ${leave.rows[0].to_date} has been approved.`,
          ],
        );
      } else if (action === "rejected") {
        await client.query(
          `INSERT INTO notifications(user_id, title, message)
     VALUES($1,$2,$3)`,
          [
            leave.rows[0].employee_id,
            "Leave Rejected ❌",
            `Your leave request has been rejected. Remarks: ${remarks || "No remarks"}`,
          ],
        );
      }

      await client.query("COMMIT");

      res.json({ message: `Leave ${action} successfully` });
    } catch (error) {
      await client.query("ROLLBACK");
      console.log("LEAVE ACTION ERROR:", error.message);
      res.status(500).json({ message: error.message });
    } finally {
      client.release();
    }
  },
);

// ─── GET LEAVE BALANCE ────────────────────────────────
router.get("/balance", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        lt.leave_name,
        lt.total_days,
        lb.available_days
       FROM leave_balance lb
       INNER JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET LEAVE TYPES ──────────────────────────────────
router.get("/types", auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leave_types ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET APPROVAL HISTORY ─────────────────────────────
router.get("/history/:leave_id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        ah.action,
        ah.remarks,
        ah.created_at,
        u.name AS approved_by
       FROM approval_history ah
       INNER JOIN users u ON ah.approved_by = u.id
       WHERE ah.leave_id = $1
       ORDER BY ah.created_at DESC`,
      [req.params.leave_id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── LEAVE STATS (Admin/HR) ───────────────────────────
router.get("/stats", auth, role("manager", "hr", "admin"), async (req, res) => {
  try {
    const total = await pool.query("SELECT COUNT(*) FROM leave_applications");
    const pending = await pool.query(
      "SELECT COUNT(*) FROM leave_applications WHERE status='pending'",
    );
    const approved = await pool.query(
      "SELECT COUNT(*) FROM leave_applications WHERE status='approved'",
    );
    const rejected = await pool.query(
      "SELECT COUNT(*) FROM leave_applications WHERE status='rejected'",
    );

    res.json({
      total: parseInt(total.rows[0].count),
      pending: parseInt(pending.rows[0].count),
      approved: parseInt(approved.rows[0].count),
      rejected: parseInt(rejected.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── INIT LEAVE BALANCE FOR NEW USER ─────────────────
router.post(
  "/init-balance/:user_id",
  auth,
  role("admin", "hr"),
  async (req, res) => {
    try {
      const { user_id } = req.params;
      const types = await pool.query("SELECT * FROM leave_types");

      for (const type of types.rows) {
        // Check if already exists
        const exists = await pool.query(
          "SELECT * FROM leave_balance WHERE employee_id=$1 AND leave_type_id=$2",
          [user_id, type.id],
        );
        if (exists.rows.length === 0) {
          await pool.query(
            "INSERT INTO leave_balance(employee_id, leave_type_id, available_days) VALUES($1,$2,$3)",
            [user_id, type.id, type.total_days],
          );
        }
      }

      res.json({ message: "Leave balance initialized successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
