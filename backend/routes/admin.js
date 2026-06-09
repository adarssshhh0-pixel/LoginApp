const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { getDashboardStats, getAllUsers, updateUserRole, getAuditLogs } = require("../controllers/adminController");

router.get("/stats", auth, authorize("admin", "hr"), getDashboardStats);
router.get("/users", auth, authorize("admin"), getAllUsers);
router.put("/users/:id/role", auth, authorize("admin"), updateUserRole);
router.get("/audit-logs", auth, authorize("admin", "hr"), getAuditLogs);

module.exports = router;