const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const employees = await pool.query("SELECT COUNT(*) FROM employee_profiles");
    const departments = await pool.query("SELECT COUNT(*) FROM departments");
    const skills = await pool.query("SELECT COUNT(*) FROM skills");
    const images = await pool.query("SELECT COUNT(*) FROM employee_images");

    res.json({
      totalEmployees: parseInt(employees.rows[0].count),
      totalDepartments: parseInt(departments.rows[0].count),
      totalSkills: parseInt(skills.rows[0].count),
      totalImages: parseInt(images.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Single route that returns everything dashboard needs
router.get("/dashboard", auth, async (req, res) => {
  try {
    const [employees, departments, skills, images, leaveStats] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM employee_profiles"),
      pool.query("SELECT COUNT(*) FROM departments"),
      pool.query("SELECT COUNT(*) FROM skills"),
      pool.query("SELECT COUNT(*) FROM employee_images"),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='pending')  AS pending,
          COUNT(*) FILTER (WHERE status='approved') AS approved,
          COUNT(*) FILTER (WHERE status='rejected') AS rejected,
          COUNT(*) AS total
        FROM leave_applications
        WHERE employee_id=$1
      `, [req.user.id]),
    ]);

    res.json({
      totalEmployees:   parseInt(employees.rows[0].count),
      totalDepartments: parseInt(departments.rows[0].count),
      totalSkills:      parseInt(skills.rows[0].count),
      totalImages:      parseInt(images.rows[0].count),
      myLeaves: leaveStats.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;