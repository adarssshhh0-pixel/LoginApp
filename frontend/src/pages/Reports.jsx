import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#4f46e5", "#16a34a", "#d97706", "#dc2626", "#0891b2", "#7c3aed", "#be123c", "#0f766e"];

function Reports() {
  const [tab, setTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [assets, setAssets] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [leaveStatus, setLeaveStatus] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const headers = { Authorization: token };
    const fetchAll = async () => {
      try {
        const [empRes, deptRes] = await Promise.all([
          axios.get("http://localhost:5000/api/reports/employees", { headers }),
          axios.get("http://localhost:5000/api/reports/department-stats", { headers }),
        ]);
        setEmployees(empRes.data);
        setDeptStats(deptRes.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    fetchAll();
  }, [token, navigate]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/reports/leaves?status=${leaveStatus}`,
        { headers: { Authorization: token } }
      );
      setLeaves(res.data);
    } catch (err) { handleApiError(err, navigate); }
  };

  const fetchAssets = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reports/assets", { headers: { Authorization: token } });
      setAssets(res.data);
    } catch (err) { handleApiError(err, navigate); }
  };

  useEffect(() => { if (tab === "leaves") fetchLeaves(); }, [tab, leaveStatus]);
  useEffect(() => { if (tab === "assets") fetchAssets(); }, [tab]);

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const getStatusStyle = (status) => {
    if (status === "approved") return { backgroundColor: "#dcfce7", color: "#16a34a" };
    if (status === "rejected") return { backgroundColor: "#fee2e2", color: "#dc2626" };
    return { backgroundColor: "#fef9c3", color: "#d97706" };
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2>📊 Reports & Analytics</h2>
        <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["employees", "leaves", "assets", "charts"].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }} onClick={() => setTab(t)}>
            {t === "employees" && "👥 Employees"}
            {t === "leaves"    && "📋 Leaves"}
            {t === "assets"    && "💻 Assets"}
            {t === "charts"    && "📈 Charts"}
          </button>
        ))}
      </div>

      {/* Employee Report */}
      {tab === "employees" && (
        <>
          <div style={styles.exportBar}>
            <span style={styles.count}>{employees.length} employees</span>
            <button style={styles.exportBtn} onClick={() => exportToExcel(employees, "Employee_Report")}>
              📥 Export Excel
            </button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead><tr style={styles.thead}>
                <th style={styles.th}>Name</th><th style={styles.th}>Email</th>
                <th style={styles.th}>Department</th><th style={styles.th}>Designation</th>
                <th style={styles.th}>Salary</th><th style={styles.th}>Role</th>
              </tr></thead>
              <tbody>
                {employees.map((e, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{e.name}</td>
                    <td style={styles.td}>{e.email}</td>
                    <td style={styles.td}>{e.department_name}</td>
                    <td style={styles.td}>{e.designation}</td>
                    <td style={styles.td}>₹{e.salary?.toLocaleString()}</td>
                    <td style={styles.td}>{e.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Leave Report */}
      {tab === "leaves" && (
        <>
          <div style={styles.exportBar}>
            <select style={styles.filterSelect} value={leaveStatus} onChange={(e) => setLeaveStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button style={styles.exportBtn} onClick={() => exportToExcel(leaves, "Leave_Report")}>📥 Export Excel</button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead><tr style={styles.thead}>
                <th style={styles.th}>Employee</th><th style={styles.th}>Leave Type</th>
                <th style={styles.th}>From</th><th style={styles.th}>To</th>
                <th style={styles.th}>Days</th><th style={styles.th}>Status</th>
              </tr></thead>
              <tbody>
                {leaves.map((l, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{l.employee_name}</td>
                    <td style={styles.td}>{l.leave_name}</td>
                    <td style={styles.td}>{new Date(l.from_date).toLocaleDateString()}</td>
                    <td style={styles.td}>{new Date(l.to_date).toLocaleDateString()}</td>
                    <td style={styles.td}>{l.total_days}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, ...getStatusStyle(l.status) }}>{l.status?.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Asset Report */}
      {tab === "assets" && (
        <>
          <div style={styles.exportBar}>
            <span style={styles.count}>{assets.length} assets</span>
            <button style={styles.exportBtn} onClick={() => exportToExcel(assets, "Asset_Report")}>📥 Export Excel</button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead><tr style={styles.thead}>
                <th style={styles.th}>Code</th><th style={styles.th}>Name</th>
                <th style={styles.th}>Type</th><th style={styles.th}>Cost</th>
                <th style={styles.th}>Status</th><th style={styles.th}>Assigned To</th>
              </tr></thead>
              <tbody>
                {assets.map((a, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{a.asset_code}</td>
                    <td style={styles.td}>{a.asset_name}</td>
                    <td style={styles.td}>{a.asset_type}</td>
                    <td style={styles.td}>₹{a.purchase_cost?.toLocaleString()}</td>
                    <td style={styles.td}>{a.status}</td>
                    <td style={styles.td}>{a.assigned_to || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Charts */}
      {tab === "charts" && (
        <div style={styles.chartsGrid}>

          {/* Bar Chart — Department Employee Count */}
          <div style={styles.chartCard}>
            <h3>👥 Department Wise Employees</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptStats}>
                <XAxis dataKey="department_name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_employees" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart — Department Salary */}
          <div style={styles.chartCard}>
            <h3>💰 Department Wise Salary</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deptStats} dataKey="total_salary" nameKey="department_name" cx="50%" cy="50%" outerRadius={90} label>
                  {deptStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart — Avg Salary */}
          <div style={styles.chartCard}>
            <h3>📊 Average Salary by Department</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptStats}>
                <XAxis dataKey="department_name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
                <Bar dataKey="avg_salary" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "sans-serif", padding: 32, backgroundColor: "#f9fafb", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  backBtn: { padding: "8px 16px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  tabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tab: { padding: "8px 20px", backgroundColor: "#e2e8f0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  activeTab: { backgroundColor: "#4f46e5", color: "#fff" },
  exportBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  count: { fontSize: 14, color: "#64748b" },
  filterSelect: { padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 },
  exportBtn: { padding: "8px 16px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1e293b" },
  th: { padding: "12px 16px", color: "#fff", textAlign: "left", fontSize: 13 },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: 14 },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "600" },
  chartsGrid: { display: "flex", flexWrap: "wrap", gap: 20 },
  chartCard: { flex: 1, minWidth: 320, backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
};

export default Reports;