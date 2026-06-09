const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

// Employee Report
router.get("/employees", auth, role("admin", "hr"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.name,
        u.email,
        u.role,
        d.department_name,
        ep.designation,
        ep.salary,
        ep.phone
      FROM employee_summary
      ORDER BY d.department_name, ep.salary DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave Report
router.get("/leaves", auth, role("admin", "hr", "manager"), async (req, res) => {
  try {
    const { status, from, to } = req.query;
    let query = `
      SELECT
        u.name AS employee_name,
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
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    if (status) { query += ` AND la.status=$${idx++}`; params.push(status); }
    if (from)   { query += ` AND la.from_date >= $${idx++}`; params.push(from); }
    if (to)     { query += ` AND la.to_date <= $${idx++}`; params.push(to); }
    query += " ORDER BY la.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Department wise stats
router.get("/department-stats", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.department_name,
        COUNT(ep.id) AS total_employees,
        AVG(ep.salary)::NUMERIC(10,2) AS avg_salary,
        SUM(ep.salary) AS total_salary
      FROM departments d
      LEFT JOIN employee_profiles ep ON d.id = ep.department_id
      GROUP BY d.department_name
      ORDER BY total_employees DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Asset Report
router.get("/assets", auth, role("admin", "hr"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.asset_code,
        a.asset_name,
        a.asset_type,
        a.purchase_cost,
        a.status,
        u.name AS assigned_to
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status='allocated'
      LEFT JOIN users u ON aa.employee_id = u.id
      ORDER BY a.asset_type, a.status
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Audit Logs
router.get("/audit-logs", auth, role("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        al.*,
        u.name AS performed_by_name
      FROM audit_logs al
      LEFT JOIN users u ON al.performed_by = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;