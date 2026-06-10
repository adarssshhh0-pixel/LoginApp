const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

// ─── MARK ATTENDANCE (Admin/HR) ───────────────────────
router.post("/mark", auth, role("admin", "hr", "manager"), async (req, res) => {
  try {
    const { records, date } = req.body;
    // records = [{ employee_id, status, check_in, check_out }]
    const attendanceDate = date || new Date().toISOString().split("T")[0];

    for (const record of records) {
      const { employee_id, status, check_in, check_out } = record;

      // Calculate working hours
      let working_hours = 0;
      if (check_in && check_out) {
        const [inH, inM] = check_in.split(":").map(Number);
        const [outH, outM] = check_out.split(":").map(Number);
        working_hours = ((outH * 60 + outM) - (inH * 60 + inM)) / 60;
        if (working_hours < 0) working_hours = 0;
      } else if (status === "present") {
        working_hours = 8;
      } else if (status === "half_day") {
        working_hours = 4;
      }

      await pool.query(`
        INSERT INTO attendance(employee_id, date, status, check_in, check_out, working_hours, marked_by)
        VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT(employee_id, date)
        DO UPDATE SET status=$3, check_in=$4, check_out=$5, working_hours=$6, marked_by=$7
      `, [employee_id, attendanceDate, status, check_in || null, check_out || null, working_hours, req.user.id]);
    }

    res.json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.log("ATTENDANCE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ATTENDANCE BY DATE ───────────────────────────
router.get("/date/:date", auth, role("admin", "hr", "manager"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id, a.date, a.status, a.check_in, a.check_out, a.working_hours,
        u.id AS employee_id, u.name, u.email,
        d.department_name, ep.designation
      FROM users u
      LEFT JOIN attendance a ON u.id = a.employee_id AND a.date=$1
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE u.role = 'employee' OR u.role = 'hr' OR u.role = 'manager'
      ORDER BY u.name
    `, [req.params.date]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET MY ATTENDANCE ────────────────────────────────
router.get("/my", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM attendance
      WHERE employee_id=$1
      ORDER BY date DESC
      LIMIT 30
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ATTENDANCE STATS FOR CHARTS ──────────────────
router.get("/stats", auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    // Daily attendance count for last 30 days
    const daily = await pool.query(`
      SELECT
        date,
        COUNT(*) FILTER (WHERE status='present')  AS present,
        COUNT(*) FILTER (WHERE status='absent')   AS absent,
        COUNT(*) FILTER (WHERE status='half_day') AS half_day,
        COUNT(*) FILTER (WHERE status='late')     AS late
      FROM attendance
      WHERE EXTRACT(MONTH FROM date)=$1
        AND EXTRACT(YEAR FROM date)=$2
      GROUP BY date
      ORDER BY date
    `, [m, y]);

    // Per employee attendance this month
    const perEmployee = await pool.query(`
      SELECT
        u.name,
        COUNT(*) FILTER (WHERE a.status='present')  AS present,
        COUNT(*) FILTER (WHERE a.status='absent')   AS absent,
        COUNT(*) FILTER (WHERE a.status='half_day') AS half_day,
        COUNT(*) FILTER (WHERE a.status='late')     AS late,
        ROUND(AVG(a.working_hours)::numeric, 1)     AS avg_hours
      FROM users u
      LEFT JOIN attendance a ON u.id = a.employee_id
        AND EXTRACT(MONTH FROM a.date)=$1
        AND EXTRACT(YEAR FROM a.date)=$2
      WHERE u.role IN ('employee','hr','manager')
      GROUP BY u.name
      ORDER BY present DESC
    `, [m, y]);

    // Today's summary
    const today = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='present')  AS present,
        COUNT(*) FILTER (WHERE status='absent')   AS absent,
        COUNT(*) FILTER (WHERE status='half_day') AS half_day,
        COUNT(*) FILTER (WHERE status='late')     AS late,
        COUNT(*) AS total
      FROM attendance
      WHERE date=CURRENT_DATE
    `);

    res.json({
      daily:       daily.rows,
      perEmployee: perEmployee.rows,
      today:       today.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET EMPLOYEE ATTENDANCE WEIGHTAGE ────────────────
router.get("/weightage", auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    const result = await pool.query(`
      SELECT
        u.name,
        u.email,
        d.department_name,
        COUNT(a.id) AS total_days,
        COUNT(*) FILTER (WHERE a.status='present')  AS present,
        COUNT(*) FILTER (WHERE a.status='absent')   AS absent,
        COUNT(*) FILTER (WHERE a.status='half_day') AS half_day,
        COUNT(*) FILTER (WHERE a.status='late')     AS late,
        COALESCE(SUM(a.working_hours), 0)           AS total_hours,
        ROUND(
          (
            COUNT(*) FILTER (WHERE a.status='present') * 1.0 +
            COUNT(*) FILTER (WHERE a.status='late')    * 0.75 +
            COUNT(*) FILTER (WHERE a.status='half_day')* 0.5
          ) / NULLIF(COUNT(a.id), 0) * 100
        , 1) AS weightage
      FROM users u
      LEFT JOIN attendance a ON u.id = a.employee_id
        AND EXTRACT(MONTH FROM a.date)=$1
        AND EXTRACT(YEAR FROM a.date)=$2
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE u.role IN ('employee','hr','manager')
      GROUP BY u.name, u.email, d.department_name
      ORDER BY weightage DESC NULLS LAST
    `, [m, y]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;