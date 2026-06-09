const pool = require("../config/db");

// Apply for Leave
const applyLeave = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { leave_type_id, start_date, end_date, reason } = req.body;
    const user_id = req.user.id;

    // Calculate days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (total_days <= 0)
      return res.status(400).json({ message: "Invalid date range" });

    // Check balance
    const balance = await client.query(
      `SELECT * FROM leave_balances WHERE user_id=$1 AND leave_type_id=$2`,
      [user_id, leave_type_id]
    );

    if (balance.rows.length === 0)
      return res.status(400).json({ message: "No leave balance found" });

    const available = balance.rows[0].total_days - balance.rows[0].used_days;
    if (total_days > available)
      return res.status(400).json({ message: `Insufficient balance. Available: ${available} days` });

    // Insert application
    const application = await client.query(
      `INSERT INTO leave_applications(user_id, leave_type_id, start_date, end_date, total_days, reason)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_id, leave_type_id, start_date, end_date, total_days, reason]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs(action, performed_by, target_user_id, leave_application_id, details)
       VALUES($1,$2,$3,$4,$5)`,
      ["LEAVE_APPLIED", user_id, user_id, application.rows[0].id, `Applied for ${total_days} days leave`]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Leave application submitted", application: application.rows[0] });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// Get My Leaves
const getMyLeaves = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT la.*, lt.name as leave_type_name
       FROM leave_applications la
       JOIN leave_types lt ON la.leave_type_id = lt.id
       WHERE la.user_id = $1
       ORDER BY la.created_at DESC`,
      [req.user.id]
    );
    res.json({ leaves: result.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get My Balance
const getMyBalance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lb.*, lt.name as leave_type_name, lt.max_days,
              (lb.total_days - lb.used_days) as available_days
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = $1`,
      [req.user.id]
    );
    res.json({ balances: result.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manager Approve/Reject
const managerAction = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approved' or 'rejected'

    const leave = await client.query(
      `UPDATE leave_applications
       SET manager_status=$1, manager_comment=$2,
           status = CASE WHEN $1='rejected' THEN 'rejected' ELSE 'manager_approved' END
       WHERE id=$3 RETURNING *`,
      [action, comment, id]
    );

    await client.query(
      `INSERT INTO audit_logs(action, performed_by, target_user_id, leave_application_id, details)
       VALUES($1,$2,$3,$4,$5)`,
      [`MANAGER_${action.toUpperCase()}`, req.user.id, leave.rows[0].user_id, id, comment || ""]
    );

    await client.query("COMMIT");
    res.json({ message: `Leave ${action} by manager`, leave: leave.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// HR Final Approve/Reject
const hrAction = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { action, comment } = req.body;

    const leave = await client.query(
      `UPDATE leave_applications
       SET hr_status=$1, hr_comment=$2,
           status = CASE WHEN $1='approved' THEN 'approved' ELSE 'rejected' END
       WHERE id=$3 RETURNING *`,
      [action, comment, id]
    );

    // Deduct balance if finally approved
    if (action === "approved") {
      await client.query(
        `UPDATE leave_balances SET used_days = used_days + $1
         WHERE user_id=$2 AND leave_type_id=$3`,
        [leave.rows[0].total_days, leave.rows[0].user_id, leave.rows[0].leave_type_id]
      );
    }

    await client.query(
      `INSERT INTO audit_logs(action, performed_by, target_user_id, leave_application_id, details)
       VALUES($1,$2,$3,$4,$5)`,
      [`HR_${action.toUpperCase()}`, req.user.id, leave.rows[0].user_id, id, comment || ""]
    );

    await client.query("COMMIT");
    res.json({ message: `Leave ${action} by HR`, leave: leave.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// Get Pending Leaves (for Manager/HR)
const getPendingLeaves = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT la.*, lt.name as leave_type_name,
              u.name as employee_name, u.email as employee_email
       FROM leave_applications la
       JOIN leave_types lt ON la.leave_type_id = lt.id
       JOIN users u ON la.user_id = u.id
       WHERE la.status NOT IN ('approved','rejected')
       ORDER BY la.created_at ASC`
    );
    res.json({ leaves: result.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLeave, getMyLeaves, getMyBalance, managerAction, hrAction, getPendingLeaves };