const pool = require("../config/db");

const auditLog = async ({ tableName, actionType, recordId, oldData, newData, performedBy }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs(table_name, action_type, record_id, old_data, new_data, performed_by)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [tableName, actionType, recordId, JSON.stringify(oldData), JSON.stringify(newData), performedBy]
    );
  } catch (error) {
    console.log("Audit log error:", error.message);
  }
};

module.exports = auditLog;