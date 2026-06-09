const pool = require("../config/db");

const sendNotification = async ({ userId, title, message }) => {
  try {
    await pool.query(
      `INSERT INTO notifications(user_id, title, message)
       VALUES($1,$2,$3)`,
      [userId, title, message]
    );
  } catch (error) {
    console.log("Notification error:", error.message);
  }
};

module.exports = sendNotification;