const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const auditLog = require("../utils/audit");
const sendNotification = require("../utils/notify");

// ─── GET ALL ASSETS ───────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM assets WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) { query += ` AND status=$${idx++}`; params.push(status); }
    if (type)   { query += ` AND asset_type=$${idx++}`; params.push(type); }
    if (search) { query += ` AND (asset_name ILIKE $${idx} OR asset_code ILIKE $${idx++})`; params.push(`%${search}%`); }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM assets WHERE 1=1${status ? ` AND status='${status}'` : ""}`,
      []
    );

    query += ` ORDER BY id DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      assets: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── CREATE ASSET ─────────────────────────────────────
router.post("/", auth, role("admin", "hr"), async (req, res) => {
  try {
    const { asset_code, asset_name, asset_type, purchase_date, purchase_cost } = req.body;

    const result = await pool.query(
      `INSERT INTO assets(asset_code, asset_name, asset_type, purchase_date, purchase_cost, status)
       VALUES($1,$2,$3,$4,$5,'available') RETURNING *`,
      [asset_code, asset_name, asset_type, purchase_date, purchase_cost]
    );

    await auditLog({
      tableName: "assets",
      actionType: "INSERT",
      recordId: result.rows[0].id,
      oldData: null,
      newData: result.rows[0],
      performedBy: req.user.id,
    });

    res.status(201).json({ message: "Asset created", asset: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── ALLOCATE ASSET ───────────────────────────────────
router.post("/allocate", auth, role("admin", "hr"), async (req, res) => {
  try {
    const { asset_id, employee_id } = req.body;

    // Check asset is available
    const asset = await pool.query("SELECT * FROM assets WHERE id=$1", [asset_id]);
    if (asset.rows[0].status !== "available") {
      return res.status(400).json({ message: "Asset is not available" });
    }

    // Allocate
    const allocation = await pool.query(
      `INSERT INTO asset_allocations(asset_id, employee_id, allocated_by, status)
       VALUES($1,$2,$3,'allocated') RETURNING *`,
      [asset_id, employee_id, req.user.id]
    );

    // Update asset status
    await pool.query("UPDATE assets SET status='allocated' WHERE id=$1", [asset_id]);

    // Asset history
    await pool.query(
      `INSERT INTO asset_history(asset_id, action, remarks, created_by)
       VALUES($1,'allocated','Asset allocated to employee',$2)`,
      [asset_id, req.user.id]
    );

    // Send notification to employee
    await sendNotification({
      userId: employee_id,
      title: "Asset Assigned 💻",
      message: `${asset.rows[0].asset_name} has been assigned to you.`,
    });

    // Audit log
    await auditLog({
      tableName: "asset_allocations",
      actionType: "INSERT",
      recordId: allocation.rows[0].id,
      oldData: null,
      newData: allocation.rows[0],
      performedBy: req.user.id,
    });

    res.status(201).json({ message: "Asset allocated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── RETURN ASSET ─────────────────────────────────────
router.put("/return/:id", auth, role("admin", "hr"), async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const allocation = await pool.query(
      "SELECT * FROM asset_allocations WHERE id=$1",
      [id]
    );

    if (allocation.rows.length === 0) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    const assetId = allocation.rows[0].asset_id;

    // Update allocation
    await pool.query(
      `UPDATE asset_allocations
       SET status='returned', return_date=CURRENT_DATE
       WHERE id=$1`,
      [id]
    );

    // Update asset status
    await pool.query("UPDATE assets SET status='available' WHERE id=$1", [assetId]);

    // Asset history
    await pool.query(
      `INSERT INTO asset_history(asset_id, action, remarks, created_by)
       VALUES($1,'returned',$2,$3)`,
      [assetId, remarks || "Asset returned", req.user.id]
    );

    res.json({ message: "Asset returned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ALLOCATED ASSETS ─────────────────────────────
router.get("/allocated", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        aa.id,
        a.asset_code,
        a.asset_name,
        a.asset_type,
        u.name AS employee_name,
        u.email,
        aa.allocated_date,
        aa.return_date,
        aa.status
      FROM asset_allocations aa
      INNER JOIN assets a ON aa.asset_id = a.id
      INNER JOIN users u ON aa.employee_id = u.id
      WHERE aa.status = 'allocated'
      ORDER BY aa.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ASSET STATS ──────────────────────────────────
router.get("/stats", auth, async (req, res) => {
  try {
    const total     = await pool.query("SELECT COUNT(*) FROM assets");
    const available = await pool.query("SELECT COUNT(*) FROM assets WHERE status='available'");
    const allocated = await pool.query("SELECT COUNT(*) FROM assets WHERE status='allocated'");
    const totalCost = await pool.query("SELECT SUM(purchase_cost) FROM assets");

    res.json({
      total:     parseInt(total.rows[0].count),
      available: parseInt(available.rows[0].count),
      allocated: parseInt(allocated.rows[0].count),
      totalCost: parseFloat(totalCost.rows[0].sum || 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;