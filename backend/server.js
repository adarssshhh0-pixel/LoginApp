require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const logger = require("./utils/logger");
const compression = require("compression");
const authRoutes         = require("./routes/auth");
const userRoutes         = require("./routes/user");
const departmentRoutes   = require("./routes/departments");
const skillRoutes        = require("./routes/skills");
const employeeRoutes     = require("./routes/employees");
const statsRoutes        = require("./routes/stats");
const leaveRoutes        = require("./routes/leave");
const assetRoutes        = require("./routes/assets");
const notificationRoutes = require("./routes/notifications");
const reportRoutes       = require("./routes/reports");
const pool               = require("./config/db");
const attendanceRoutes = require("./routes/attendance");
const app = express();

app.use("/api/attendance", attendanceRoutes);
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting only in production
if (process.env.NODE_ENV === "production") {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
}

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use(compression()); // ← add this before routes

// Routes
app.use("/api/auth",          authRoutes);
app.use("/api/user",          userRoutes);
app.use("/api/departments",   departmentRoutes);
app.use("/api/skills",        skillRoutes);
app.use("/api/employees",     employeeRoutes);
app.use("/api/stats",         statsRoutes);
app.use("/api/leave",         leaveRoutes);
app.use("/api/assets",        assetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports",       reportRoutes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ message: "Internal server error" });
});

// DB Test
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(process.env.PORT, () => {
  logger.info(`Server running on port ${process.env.PORT}`);
});

// TEMP — Email test route
app.get("/test-email", async (req, res) => {
  try {
    const sendOTPEmail = require("./utils/mailer");
    await sendOTPEmail({
      to: "developerchacha4@gmail.com",  // ← put your actual email here
      name: "Test User",
      otp: "123456",
    });
    res.json({ success: true, message: "Email sent!" });
  } catch (error) {
    console.log("EMAIL ERROR:", error.message);
    res.json({ success: false, error: error.message });
  }
});