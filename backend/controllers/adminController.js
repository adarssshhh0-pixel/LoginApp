const pool = require("../config/db");

// Dashboard Analytics
const getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await pool.query(`SELECT COUNT(*) FROM users WHERE role='employee'`);
    const pendingLeaves = await pool.query(`SELECT COUNT(*) FROM leave_applications WHERE status='pending' OR status='manager_approved'`);
    const approvedLeaves = await pool.query(`SELECT COUNT(*) FROM leave_applications WHERE status='approved'`);
    const rejectedLeaves = await pool.query(`SELECT COUNT(*) FROM leave_applications WHERE status='rejected'`);

    // Leave by type
    const leaveByType = await pool.query(
      `SELECT lt.name, COUNT(la.id) as count
       FROM leave_applications la
       JOIN leave_types lt ON la.leave_type_id = lt.id
       GROUP BY lt.name`
    );

    // Recent applications
    const recentApplications = await pool.query(
      `SELECT la.*, u.name as employee_name, lt.name as leave_type_name
       FROM leave_applications la
       JOIN users u ON la.user_id = u.id
       JOIN leave_types lt ON la.leave_type_id = lt.id
       ORDER BY la.created_at DESC LIMIT 5`
    );

    res.json({
      stats: {
        totalEmployees: parseInt(totalEmployees.rows[0].count),
        pendingLeaves: parseInt(pendingLeaves.rows[0].count),
        approvedLeaves: parseInt(approvedLeaves.rows[0].count),
        rejectedLeaves: parseInt(rejectedLeaves.rows[0].count),
      },
      leaveByType: leaveByType.rows,
      recentApplications: recentApplications.rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, department_id FROM users ORDER BY id`
    );
    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ["employee", "manager", "hr", "admin"];
    if (!validRoles.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const result = await pool.query(
      `UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role`,
      [role, id]
    );
    res.json({ message: "Role updated", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Audit Logs
const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.name as performed_by_name, tu.name as target_user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.performed_by = u.id
       LEFT JOIN users tu ON al.target_user_id = tu.id
       ORDER BY al.created_at DESC LIMIT 50`
    );
    res.json({ logs: result.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, getAuditLogs };