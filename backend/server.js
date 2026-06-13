require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const compression  = require("compression");
const path         = require("path");
const logger       = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const pool         = require("./config/db");

// Import routes
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
const attendanceRoutes   = require("./routes/attendance");
const payrollRoutes      = require("./routes/payroll");

// v1 API routes (new architecture)
const v1Routes = require("./src/routes/v1/index");

// Background jobs
if (process.env.NODE_ENV !== "test") {
  require("./src/jobs/scheduler");
}

const app = express();

// ── Security & Performance ────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin:         "http://localhost:3000",
  methods:        ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials:    true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static Files ──────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Request Logger ────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} — ${req.ip}`);
  next();
});

// ── Health Check ──────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.json({
      status:      "UP",
      timestamp:   new Date().toISOString(),
      uptime:      `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
      database:    { status: "UP", time: dbResult.rows[0].now },
      memory: {
        used:  `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
      environment: process.env.NODE_ENV || "development",
      version:     "1.0.0",
    });
  } catch (error) {
    res.status(500).json({ status: "DOWN", error: error.message });
  }
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ── v1 API (new architecture) ─────────────────────────────
app.use("/api/v1", v1Routes);

// ── Legacy routes (backward compatible) ──────────────────
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
app.use("/api/attendance",    attendanceRoutes);
app.use("/api/payroll",       payrollRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// ── Centralized Error Handler (MUST be last) ──────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────
const server = app.listen(process.env.PORT, () => {
  logger.info(`🚀 Server running on port ${process.env.PORT} [${process.env.NODE_ENV || "development"}]`);
});
module.exports = { app, server }; // Export for testing