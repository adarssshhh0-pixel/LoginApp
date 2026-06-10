const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendOTPEmail = require("../utils/mailer");

// ─── SIGNUP ───────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExist = await pool.query(
      "SELECT * FROM users WHERE email=$1", [email]
    );
    if (userExist.rows.length > 0)
      return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users(name, email, password, role)
       VALUES($1,$2,$3,'employee') RETURNING *`,
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "User Registered", user: newUser.rows[0] });
  } catch (error) {
    console.log("SIGNUP ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1", [email]
    );
    if (user.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword)
      return res.status(400).json({ message: "Wrong Password" });

    const token = jwt.sign(
      {
        id:     user.rows[0].id,
        name:   user.rows[0].name,
        email:  user.rows[0].email,
        role:   user.rows[0].role,
        avatar: user.rows[0].avatar,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login Success",
      token,
      role:   user.rows[0].role,
      name:   user.rows[0].name,
      avatar: user.rows[0].avatar,
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1", [email]
    );
    if (user.rows.length === 0)
      return res.status(400).json({ message: "No account found with this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      "DELETE FROM password_reset WHERE user_id=$1", [user.rows[0].id]
    );
    await pool.query(
      `INSERT INTO password_reset(user_id, token, expires_at) VALUES($1,$2,$3)`,
      [user.rows[0].id, otp, expiresAt]
    );

    await sendOTPEmail({ to: email, name: user.rows[0].name, otp });

    res.json({ message: "OTP sent to your email successfully" });
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:", error.message);
    res.status(500).json({ message: "Failed to send OTP. Check your email config." });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1", [email]
    );
    if (user.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const resetRecord = await pool.query(
      "SELECT * FROM password_reset WHERE user_id=$1 AND token::text=$2::text",
      [user.rows[0].id, otp.trim()]
    );
    if (resetRecord.rows.length === 0)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > new Date(resetRecord.rows[0].expires_at)) {
      await pool.query("DELETE FROM password_reset WHERE user_id=$1", [user.rows[0].id]);
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2",
      [hashedPassword, user.rows[0].id]
    );
    await pool.query(
      "DELETE FROM password_reset WHERE user_id=$1", [user.rows[0].id]
    );

    res.json({ message: "Password reset successful! You can now login." });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;