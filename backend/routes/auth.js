const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ─── SIGNUP ───────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExist = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users(name, email, password)
       VALUES($1, $2, $3)
       RETURNING *`,
      [name, email, hashedPassword],
    );

    res.status(201).json({
      message: "User Registered",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.log("SIGNUP ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email);

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ message: "Wrong Password" });
    }

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login Success",
      token,
      role: user.rows[0].role, // ← add this
      name: user.rows[0].name, // ← add this
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

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set expiry to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing token for this user
    await pool.query("DELETE FROM password_reset WHERE user_id=$1", [
      user.rows[0].id,
    ]);

    // Save new token in DB
    await pool.query(
      `INSERT INTO password_reset(user_id, token, expires_at)
       VALUES($1, $2, $3)`,
      [user.rows[0].id, resetToken, expiresAt],
    );

    // In production you would email this token
    // For now we return it directly for testing
    res.json({
      message: "Reset token generated",
      resetToken,
      expiresIn: "15 minutes",
    });
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find token in DB
    const resetRecord = await pool.query(
      "SELECT * FROM password_reset WHERE token=$1",
      [token],
    );

    if (resetRecord.rows.length === 0) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetRecord.rows[0].expires_at);

    if (now > expiresAt) {
      await pool.query("DELETE FROM password_reset WHERE token=$1", [token]);
      return res
        .status(400)
        .json({ message: "Token expired. Request a new one." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in users table
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [
      hashedPassword,
      resetRecord.rows[0].user_id,
    ]);

    // Delete used token
    await pool.query("DELETE FROM password_reset WHERE token=$1", [token]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
