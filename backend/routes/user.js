const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// GET /api/user/profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email FROM users WHERE id=$1",
      [req.user.id],
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all users (for employee creation dropdown)
router.get("/all", auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email FROM users");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all users (admin only)
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email, role, avatar FROM users WHERE id=$1",
      [decoded.id]  // already handled by auth middleware
    );
    res.json({ user: user.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE user role (admin only)
router.put("/role/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["admin", "manager", "hr", "employee"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, id]);

    res.json({ message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const multer = require("multer");
const path   = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);  // ← removed req.user.id (not available yet)
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

// UPDATE profile avatar
router.post("/avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    await pool.query(
      "UPDATE users SET avatar=$1 WHERE id=$2",
      [avatarUrl, req.user.id]
    );
    res.json({ message: "Avatar updated", avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE profile info
router.put("/profile", auth, async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query(
      "UPDATE users SET name=$1 WHERE id=$2",
      [name, req.user.id]
    );
    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
