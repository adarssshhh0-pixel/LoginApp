const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Just decode token — no DB call needed on every request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role, avatar }
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};