const jwt = require("jsonwebtoken");
const pool = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await pool.query(
      "SELECT id, name, email, role, avatar FROM users WHERE id=$1",
      [decoded.id]
    );

    if (user.rows.length === 0)
      return res.status(401).json({ message: "User not found" });

    req.user = user.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};