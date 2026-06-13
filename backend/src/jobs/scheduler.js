const cron = require("node-cron");
const pool = require("../../config/db");
const logger = require("../../utils/logger");

// ── Daily Notification Cleanup (midnight) ────────────────
cron.schedule("0 0 * * *", async () => {
  try {
    const result = await pool.query(
      "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'"
    );
    logger.info(`🧹 Cleaned ${result.rowCount} old notifications`);
  } catch (err) {
    logger.error("Notification cleanup failed: " + err.message);
  }
});

// ── Daily Leave Summary (8 AM) ────────────────────────────
cron.schedule("0 8 * * *", async () => {
  try {
    const pending = await pool.query(
      "SELECT COUNT(*) FROM leave_applications WHERE status='pending'"
    );
    logger.info(`📋 Daily summary: ${pending.rows[0].count} pending leave requests`);
  } catch (err) {
    logger.error("Daily summary job failed: " + err.message);
  }
});

// ── Weekly Attendance Summary (Monday 9 AM) ───────────────
cron.schedule("0 9 * * 1", async () => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) FROM attendance
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    `);
    logger.info(`📅 Weekly attendance: ${result.rows[0].count} records this week`);
  } catch (err) {
    logger.error("Weekly attendance job failed: " + err.message);
  }
});

// ── Birthday Notifications (9 AM daily) ──────────────────
cron.schedule("0 9 * * *", async () => {
  try {
    logger.info("🎂 Birthday check job ran");
  } catch (err) {
    logger.error("Birthday job failed: " + err.message);
  }
});

logger.info("✅ Background jobs scheduled");