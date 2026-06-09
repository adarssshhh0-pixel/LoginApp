const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// GET all skills
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM skills ORDER BY id"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create skill
router.post("/", auth, async (req, res) => {
  try {
    const { skill_name } = req.body;
    const result = await pool.query(
      "INSERT INTO skills(skill_name) VALUES($1) RETURNING *",
      [skill_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;