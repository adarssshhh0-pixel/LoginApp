const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { files: 5 } });

// ─── CREATE EMPLOYEE ──────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
       const { user_id, department_id, phone, address, designation, salary, skills } = req.body;
      const empUserId = user_id || req.user.id;
      console.log("Received user_id:", user_id);  
      console.log("Using empUserId:", empUserId);

    const emp = await pool.query(
      `INSERT INTO employee_profiles(user_id, department_id, phone, address, designation, salary)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [empUserId, department_id, phone, address, designation, salary]
    );

    const employeeId = emp.rows[0].id;

    // Insert skills
    if (skills && skills.length > 0) {
      for (const skillId of skills) {
        await pool.query(
          "INSERT INTO employee_skills(employee_id, skill_id) VALUES($1,$2)",
          [employeeId, skillId]
        );
      }
    }

    res.status(201).json({ message: "Employee created", employee: emp.rows[0] });
  } catch (error) {
    console.log("CREATE EMPLOYEE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ALL EMPLOYEES ────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ep.id,
        u.name,
        u.email,
        d.department_name,
        ep.phone,
        ep.designation,
        ep.salary,
        ep.created_at
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN departments d ON ep.department_id = d.id
      ORDER BY ep.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.log("GET EMPLOYEES ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── GET SINGLE EMPLOYEE ──────────────────────────────
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const emp = await pool.query(`
      SELECT
        ep.*,
        u.name, u.email,
        d.department_name
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE ep.id = $1
    `, [id]);

    if (emp.rows.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    const skills = await pool.query(`
      SELECT s.id, s.skill_name
      FROM employee_skills es
      INNER JOIN skills s ON es.skill_id = s.id
      WHERE es.employee_id = $1
    `, [id]);

    const images = await pool.query(
      "SELECT * FROM employee_images WHERE employee_id=$1",
      [id]
    );

    res.json({
      ...emp.rows[0],
      skills: skills.rows,
      images: images.rows,
    });
  } catch (error) {
    console.log("GET EMPLOYEE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── UPDATE EMPLOYEE ──────────────────────────────────
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id, phone, address, designation, salary, skills } = req.body;

    await pool.query(`
      UPDATE employee_profiles
      SET department_id=$1, phone=$2, address=$3, designation=$4, salary=$5
      WHERE id=$6
    `, [department_id, phone, address, designation, salary, id]);

    if (skills && skills.length > 0) {
      await pool.query("DELETE FROM employee_skills WHERE employee_id=$1", [id]);
      for (const skillId of skills) {
        await pool.query(
          "INSERT INTO employee_skills(employee_id, skill_id) VALUES($1,$2)",
          [id, skillId]
        );
      }
    }

    res.json({ message: "Employee updated" });
  } catch (error) {
    console.log("UPDATE EMPLOYEE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE EMPLOYEE ──────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM employee_skills WHERE employee_id=$1", [id]);
    await pool.query("DELETE FROM employee_images WHERE employee_id=$1", [id]);
    await pool.query("DELETE FROM employee_profiles WHERE id=$1", [id]);
    res.json({ message: "Employee deleted" });
  } catch (error) {
    console.log("DELETE EMPLOYEE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── IMAGE UPLOAD ─────────────────────────────────────
router.post("/upload/:id", auth, upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    for (const file of files) {
      await pool.query(
        "INSERT INTO employee_images(employee_id, image_url) VALUES($1,$2)",
        [id, `/uploads/${file.filename}`]
      );
    }

    res.json({ message: `${files.length} image(s) uploaded successfully` });
  } catch (error) {
    console.log("UPLOAD ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;