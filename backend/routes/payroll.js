const express = require("express");
const router  = express.Router();
const pool    = require("../config/db");
const auth    = require("../middleware/auth");
const role    = require("../middleware/role");
const PDFDocument = require("pdfkit");

// ─── GET PAYROLL COMPONENTS ───────────────────────────
router.get("/components", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payroll_components WHERE is_active=true ORDER BY type, id"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GENERATE PAYROLL (Admin/HR) ──────────────────────
router.post("/generate", auth, role("admin", "hr"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { month, year } = req.body;

    // Get all employees with their salaries
    const employees = await client.query(`
      SELECT u.id, u.name, u.email, ep.salary, ep.designation, d.department_name
      FROM users u
      INNER JOIN employee_profiles ep ON u.id = ep.user_id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE u.role IN ('employee','hr','manager')
    `);

    // Get payroll components
    const components = await client.query(
      "SELECT * FROM payroll_components WHERE is_active=true"
    );

    // Get attendance for this month
    const attendance = await client.query(`
      SELECT employee_id,
        COUNT(*) FILTER (WHERE status='present')  AS present,
        COUNT(*) FILTER (WHERE status='half_day') AS half_day,
        COUNT(*) FILTER (WHERE status='late')     AS late
      FROM attendance
      WHERE EXTRACT(MONTH FROM date)=$1
        AND EXTRACT(YEAR FROM date)=$2
      GROUP BY employee_id
    `, [month, year]);

    const attMap = {};
    attendance.rows.forEach(a => {
      attMap[a.employee_id] = {
        present:  parseInt(a.present)  || 0,
        half_day: parseInt(a.half_day) || 0,
        late:     parseInt(a.late)     || 0,
      };
    });

    await client.query("BEGIN");

    const results = [];

    for (const emp of employees.rows) {
      const baseSalary   = parseFloat(emp.salary) || 0;
      const att          = attMap[emp.id] || { present: 26, half_day: 0, late: 0 };
      const workingDays  = 26;
      const presentDays  = att.present + (att.half_day * 0.5) + (att.late * 0.75);
      const salaryFactor = Math.min(presentDays / workingDays, 1);

      let grossSalary      = 0;
      let totalDeductions  = 0;
      const detailsToInsert = [];

      for (const comp of components.rows) {
        let amount = 0;
        if (comp.calculation_type === "fixed") {
          amount = parseFloat(comp.value);
        } else {
          amount = (baseSalary * parseFloat(comp.value)) / 100;
        }

        // Apply attendance factor to earnings
        if (comp.type === "earning") {
          amount = amount * salaryFactor;
          grossSalary += amount;
        } else {
          totalDeductions += amount;
        }

        detailsToInsert.push({
          name:   comp.name,
          type:   comp.type,
          amount: Math.round(amount),
          compId: comp.id,
        });
      }

      const netSalary = grossSalary - totalDeductions;

      // Upsert payroll record
      const payrollRecord = await client.query(`
        INSERT INTO payroll(employee_id, month, year, gross_salary, total_deductions, net_salary, working_days, present_days, status, processed_by, processed_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'processed',$9,NOW())
        ON CONFLICT(employee_id, month, year)
        DO UPDATE SET
          gross_salary=$4, total_deductions=$5, net_salary=$6,
          working_days=$7, present_days=$8, status='processed',
          processed_by=$9, processed_at=NOW()
        RETURNING id
      `, [emp.id, month, year, Math.round(grossSalary), Math.round(totalDeductions), Math.round(netSalary), workingDays, Math.round(presentDays), req.user.id]);

      const payrollId = payrollRecord.rows[0].id;

      // Delete old details and insert new
      await client.query("DELETE FROM payroll_details WHERE payroll_id=$1", [payrollId]);
      for (const detail of detailsToInsert) {
        await client.query(
          `INSERT INTO payroll_details(payroll_id, component_id, component_name, component_type, amount)
           VALUES($1,$2,$3,$4,$5)`,
          [payrollId, detail.compId, detail.name, detail.type, detail.amount]
        );
      }

      results.push({ name: emp.name, netSalary: Math.round(netSalary) });
    }

    await client.query("COMMIT");
    res.json({ message: `Payroll generated for ${results.length} employees`, results });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("PAYROLL ERROR:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// ─── GET PAYROLL LIST ─────────────────────────────────
router.get("/list", auth, role("admin", "hr"), async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    const result = await pool.query(`
      SELECT
        p.*,
        u.name, u.email,
        ep.designation,
        d.department_name
      FROM payroll p
      INNER JOIN users u ON p.employee_id = u.id
      INNER JOIN employee_profiles ep ON u.id = ep.user_id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE p.month=$1 AND p.year=$2
      ORDER BY p.net_salary DESC
    `, [m, y]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET MY PAYROLL ───────────────────────────────────
router.get("/my", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, ep.designation, d.department_name, u.name
      FROM payroll p
      INNER JOIN users u ON p.employee_id = u.id
      INNER JOIN employee_profiles ep ON u.id = ep.user_id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE p.employee_id=$1
      ORDER BY p.year DESC, p.month DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET PAYROLL DETAILS ──────────────────────────────
router.get("/details/:id", auth, async (req, res) => {
  try {
    const payroll = await pool.query(`
      SELECT p.*, u.name, u.email, ep.designation, d.department_name, ep.salary AS base_salary
      FROM payroll p
      INNER JOIN users u ON p.employee_id = u.id
      INNER JOIN employee_profiles ep ON u.id = ep.user_id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE p.id=$1
    `, [req.params.id]);

    const details = await pool.query(
      "SELECT * FROM payroll_details WHERE payroll_id=$1 ORDER BY component_type DESC, id",
      [req.params.id]
    );

    if (payroll.rows.length === 0)
      return res.status(404).json({ message: "Payroll not found" });

    res.json({ payroll: payroll.rows[0], details: details.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── MARK AS PAID ─────────────────────────────────────
router.put("/mark-paid/:id", auth, role("admin", "hr"), async (req, res) => {
  try {
    await pool.query(
      "UPDATE payroll SET status='paid', paid_at=NOW() WHERE id=$1",
      [req.params.id]
    );
    res.json({ message: "Marked as paid" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PAYROLL STATS ────────────────────────────────────
router.get("/stats", auth, role("admin", "hr"), async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    const stats = await pool.query(`
      SELECT
        COUNT(*)                        AS total_employees,
        COALESCE(SUM(gross_salary), 0)  AS total_gross,
        COALESCE(SUM(net_salary),   0)  AS total_net,
        COALESCE(SUM(total_deductions),0) AS total_deductions,
        COUNT(*) FILTER (WHERE status='paid')      AS paid_count,
        COUNT(*) FILTER (WHERE status='processed') AS pending_count
      FROM payroll
      WHERE month=$1 AND year=$2
    `, [m, y]);

    const deptBreakdown = await pool.query(`
      SELECT
        d.department_name,
        COUNT(p.id)            AS employees,
        SUM(p.net_salary)      AS total_net,
        AVG(p.net_salary)::NUMERIC(10,0) AS avg_net
      FROM payroll p
      INNER JOIN users u ON p.employee_id = u.id
      INNER JOIN employee_profiles ep ON u.id = ep.user_id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE p.month=$1 AND p.year=$2
      GROUP BY d.department_name
      ORDER BY total_net DESC
    `, [m, y]);

    res.json({ stats: stats.rows[0], deptBreakdown: deptBreakdown.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GENERATE PDF SALARY SLIP ─────────────────────────
router.get("/slip/:id", auth, async (req, res) => {
  try { 
     // Get token from query param (since opened in new tab)
    const token = req.query.token || req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const payroll = await pool.query(`
      SELECT p.*, u.name, u.email, ep.designation, ep.salary AS base_salary,
             ep.phone, d.department_name
      FROM payroll p
      INNER JOIN users u ON p.employee_id = u.id
      INNER JOIN employee_profiles ep ON u.id = ep.user_id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE p.id=$1
    `, [req.params.id]);

    if (payroll.rows.length === 0)
      return res.status(404).json({ message: "Payroll not found" });

    const details = await pool.query(
      "SELECT * FROM payroll_details WHERE payroll_id=$1 ORDER BY component_type DESC, id",
      [req.params.id]
    );

    const p    = payroll.rows[0];
    const d    = details.rows;
    const months = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthName = months[p.month];

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=salary_slip_${p.name.replace(/ /g,"_")}_${monthName}_${p.year}.pdf`);
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, 595, 80).fill("#1d4ed8");
    doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold")
       .text("i-SOFTZONE Technologies Pvt. Ltd.", 40, 20);
    doc.fontSize(10).font("Helvetica")
       .text("Enterprise Management System | Bhopal, Madhya Pradesh", 40, 46);
    doc.fontSize(12).font("Helvetica-Bold")
       .text("SALARY SLIP", 40, 62);

    // ── Month Banner ──
    doc.rect(0, 80, 595, 30).fill("#dbeafe");
    doc.fillColor("#1e3a8a").fontSize(11).font("Helvetica-Bold")
       .text(`Pay Period: ${monthName} ${p.year}`, 40, 90);
    doc.text(`Status: ${p.status.toUpperCase()}`, 430, 90);

    // ── Employee Info ──
    doc.fillColor("#1e3a8a").fontSize(11).font("Helvetica-Bold")
       .text("Employee Information", 40, 128);
    doc.moveTo(40, 142).lineTo(555, 142).strokeColor("#bfdbfe").lineWidth(1).stroke();

    const infoY = 150;
    doc.fillColor("#374151").fontSize(10).font("Helvetica");
    const col1 = [
      ["Employee Name", p.name],
      ["Designation",   p.designation],
      ["Department",    p.department_name],
    ];
    const col2 = [
      ["Employee ID",  `EMP-${String(p.employee_id).padStart(4,"0")}`],
      ["Email",        p.email],
      ["Working Days", `${p.present_days} / ${p.working_days}`],
    ];

    col1.forEach(([label, val], i) => {
      doc.fillColor("#6b7280").font("Helvetica").text(label + ":", 40, infoY + (i * 20));
      doc.fillColor("#111827").font("Helvetica-Bold").text(val || "—", 160, infoY + (i * 20));
    });
    col2.forEach(([label, val], i) => {
      doc.fillColor("#6b7280").font("Helvetica").text(label + ":", 310, infoY + (i * 20));
      doc.fillColor("#111827").font("Helvetica-Bold").text(String(val || "—"), 430, infoY + (i * 20));
    });

    // ── Salary Table ──
    const tableY = infoY + 80;
    doc.fillColor("#1e3a8a").fontSize(11).font("Helvetica-Bold")
       .text("Salary Breakdown", 40, tableY);
    doc.moveTo(40, tableY + 14).lineTo(555, tableY + 14).strokeColor("#bfdbfe").lineWidth(1).stroke();

    // Table header
    const hY = tableY + 22;
    doc.rect(40, hY, 255, 22).fill("#1d4ed8");
    doc.rect(300, hY, 255, 22).fill("#1d4ed8");
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
    doc.text("Earnings", 50, hY + 7);
    doc.text("Amount (₹)", 240, hY + 7, { align: "right", width: 50 });
    doc.text("Deductions", 310, hY + 7);
    doc.text("Amount (₹)", 500, hY + 7, { align: "right", width: 50 });

    const earnings   = d.filter(c => c.component_type === "earning");
    const deductions = d.filter(c => c.component_type === "deduction");
    const maxRows    = Math.max(earnings.length, deductions.length);

    let rowY = hY + 22;
    for (let i = 0; i < maxRows; i++) {
      const bgColor = i % 2 === 0 ? "#f8fafc" : "#ffffff";
      doc.rect(40,  rowY, 255, 20).fill(bgColor);
      doc.rect(300, rowY, 255, 20).fill(bgColor);

      doc.fillColor("#374151").fontSize(10).font("Helvetica");
      if (earnings[i]) {
        doc.text(earnings[i].component_name, 50, rowY + 5);
        doc.text(`₹${Number(earnings[i].amount).toLocaleString()}`, 240, rowY + 5, { align: "right", width: 50 });
      }
      if (deductions[i]) {
        doc.fillColor("#dc2626").text(deductions[i].component_name, 310, rowY + 5);
        doc.text(`₹${Number(deductions[i].amount).toLocaleString()}`, 500, rowY + 5, { align: "right", width: 50 });
      }
      rowY += 20;
    }

    // Totals row
    doc.rect(40, rowY, 255, 24).fill("#dbeafe");
    doc.rect(300, rowY, 255, 24).fill("#fee2e2");
    doc.fillColor("#1e3a8a").fontSize(10).font("Helvetica-Bold");
    doc.text("Gross Earnings", 50, rowY + 7);
    doc.text(`₹${Number(p.gross_salary).toLocaleString()}`, 240, rowY + 7, { align: "right", width: 50 });
    doc.fillColor("#dc2626");
    doc.text("Total Deductions", 310, rowY + 7);
    doc.text(`₹${Number(p.total_deductions).toLocaleString()}`, 500, rowY + 7, { align: "right", width: 50 });
    rowY += 24;

    // Net salary box
    const netY = rowY + 16;
    doc.rect(40, netY, 515, 40).fill("#1d4ed8");
    doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold");
    doc.text("NET SALARY (Take Home)", 50, netY + 12);
    doc.text(`₹ ${Number(p.net_salary).toLocaleString()}`, 300, netY + 12, { align: "right", width: 245 });

    // ── Footer ──
    const footY = netY + 68;
    doc.moveTo(40, footY).lineTo(555, footY).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    doc.fillColor("#9ca3af").fontSize(9).font("Helvetica")
       .text("This is a computer-generated salary slip and does not require a signature.", 40, footY + 8, { align: "center", width: 515 });
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")} | i-SOFTZONE Technologies Pvt. Ltd.`, 40, footY + 22, { align: "center", width: 515 });

    doc.end();
  } catch (error) {
    console.log("PDF ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;