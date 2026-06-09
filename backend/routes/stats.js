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

module.exports = router;