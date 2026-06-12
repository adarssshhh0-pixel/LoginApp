import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import Layout from "../components/Layout";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#1d4ed8",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#7c3aed",
  "#be123c",
  "#0f766e",
];

function Reports() {
  const [tab, setTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [assets, setAssets] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveStatus, setLeaveStatus] = useState("");
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch employees + dept stats on load
  useEffect(() => {
    const fetchBase = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: token };
        const [empRes, deptRes] = await Promise.all([
          axios.get("http://localhost:5000/api/reports/employees", { headers }),
          axios.get("http://localhost:5000/api/reports/department-stats", {
            headers,
          }),
        ]);
        setEmployees(empRes.data);
        setDeptStats(deptRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
        handleApiError(err, navigate);
      } finally {
        setLoading(false);
      }
    };
    fetchBase();
  }, [token, navigate]);

  // Fetch leaves when tab changes
  useEffect(() => {
    if (tab !== "leaves") return;
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/reports/leaves?status=${leaveStatus}`,
          { headers: { Authorization: token } },
        );
        setLeaves(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load leaves");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, [tab, leaveStatus, token]);

  // Fetch assets when tab changes
  useEffect(() => {
    if (tab !== "assets") return;
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "http://localhost:5000/api/reports/assets",
          { headers: { Authorization: token } },
        );
        setAssets(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load assets");
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [tab, token]);

  // Fetch attendance report
  useEffect(() => {
    if (tab !== "attendance") return;
    const fetchAtt = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/reports/attendance?month=${attMonth}&year=${attYear}`,
          { headers: { Authorization: token } },
        );
        setAttendance(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };
    fetchAtt();
  }, [tab, attMonth, attYear, token]);

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const getStatusStyle = (status) => {
    if (status === "approved")
      return { backgroundColor: "#dcfce7", color: "#059669" };
    if (status === "rejected")
      return { backgroundColor: "#fee2e2", color: "#dc2626" };
    return { backgroundColor: "#fef3c7", color: "#d97706" };
  };

  const getWeightageColor = (w) => {
    if (w >= 90) return "#059669";
    if (w >= 75) return "#d97706";
    if (w >= 50) return "#f59e0b";
    return "#dc2626";
  };

  const tabs = [
    { key: "employees", label: "👥 Employees" },
    { key: "leaves", label: "📋 Leaves" },
    { key: "assets", label: "💻 Assets" },
    { key: "attendance", label: "📅 Attendance" },
    { key: "charts", label: "📈 Charts" },
  ];

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>📊 Reports & Analytics</h1>
          <p style={styles.pageSub}>
            Export and analyze your organization data
          </p>
        </div>
        <Link to="/dashboard">
          <button style={styles.backBtn}>← Dashboard</button>
        </Link>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            style={{
              ...styles.tab,
              ...(tab === t.key ? styles.activeTab : {}),
            }}
            onClick={() => {
              setTab(t.key);
              setError("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>❌ {error}</div>}

      {/* Loading */}
      {loading && <div style={styles.loadingBox}>⏳ Loading data...</div>}

      {/* ── EMPLOYEE REPORT ── */}
      {tab === "employees" && !loading && (
        <>
          <div style={styles.exportBar}>
            <span style={styles.count}>{employees.length} employees</span>
            <button
              style={styles.exportBtn}
              onClick={() => exportToExcel(employees, "Employee_Report")}
            >
              📥 Export Excel
            </button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Designation</th>
                  <th style={styles.th}>Salary</th>
                  <th style={styles.th}>Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.empty}>
                      No employees found
                    </td>
                  </tr>
                ) : (
                  employees.map((e, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.empName}>{e.name}</span>
                      </td>
                      <td style={styles.td}>{e.email}</td>
                      <td style={styles.td}>
                        <span style={styles.deptBadge}>
                          {e.department_name}
                        </span>
                      </td>
                      <td style={styles.td}>{e.designation}</td>
                      <td style={styles.td}>
                        ₹{Number(e.salary).toLocaleString()}
                      </td>
                      <td style={styles.td}>{e.role}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* ── LEAVE REPORT ── */}
      {tab === "leaves" && !loading && (
        <>
          <div style={styles.exportBar}>
            <select
              style={styles.filterSelect}
              value={leaveStatus}
              onChange={(e) => setLeaveStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <span style={styles.count}>{leaves.length} records</span>
            <button
              style={styles.exportBtn}
              onClick={() => exportToExcel(leaves, "Leave_Report")}
            >
              📥 Export Excel
            </button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Leave Type</th>
                  <th style={styles.th}>From</th>
                  <th style={styles.th}>To</th>
                  <th style={styles.th}>Days</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.empty}>
                      No leave records found
                    </td>
                  </tr>
                ) : (
                  leaves.map((l, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.empName}>{l.employee_name}</span>
                      </td>
                      <td style={styles.td}>{l.leave_name}</td>
                      <td style={styles.td}>
                        {new Date(l.from_date).toLocaleDateString("en-IN")}
                      </td>
                      <td style={styles.td}>
                        {new Date(l.to_date).toLocaleDateString("en-IN")}
                      </td>
                      <td style={styles.td}>{l.total_days}d</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...getStatusStyle(l.status),
                          }}
                        >
                          {l.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── ASSET REPORT ── */}
      {tab === "assets" && !loading && (
        <>
          <div style={styles.exportBar}>
            <span style={styles.count}>{assets.length} assets</span>
            <button
              style={styles.exportBtn}
              onClick={() => exportToExcel(assets, "Asset_Report")}
            >
              📥 Export Excel
            </button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Cost</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.empty}>
                      No assets found
                    </td>
                  </tr>
                ) : (
                  assets.map((a, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>{a.asset_code}</td>
                      <td style={styles.td}>{a.asset_name}</td>
                      <td style={styles.td}>{a.asset_type}</td>
                      <td style={styles.td}>
                        ₹{Number(a.purchase_cost).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              a.status === "available" ? "#dcfce7" : "#dbeafe",
                            color:
                              a.status === "available" ? "#059669" : "#1d4ed8",
                          }}
                        >
                          {a.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>{a.assigned_to || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── ATTENDANCE REPORT ── */}
      {tab === "attendance" && !loading && (
        <>
          <div style={styles.exportBar}>
            <select
              style={styles.filterSelect}
              value={attMonth}
              onChange={(e) => setAttMonth(e.target.value)}
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              style={styles.filterSelect}
              value={attYear}
              onChange={(e) => setAttYear(e.target.value)}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span style={styles.count}>{attendance.length} employees</span>
            <button
              style={styles.exportBtn}
              onClick={() => exportToExcel(attendance, "Attendance_Report")}
            >
              📥 Export Excel
            </button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Present</th>
                  <th style={styles.th}>Absent</th>
                  <th style={styles.th}>Half Day</th>
                  <th style={styles.th}>Late</th>
                  <th style={styles.th}>Total Hours</th>
                  <th style={styles.th}>Weightage</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={styles.empty}>
                      No attendance data for this month
                    </td>
                  </tr>
                ) : (
                  attendance.map((a, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.empName}>{a.name}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.deptBadge}>
                          {a.department_name || "—"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: "#059669", fontWeight: "700" }}>
                          {a.present}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: "#dc2626", fontWeight: "700" }}>
                          {a.absent}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: "#d97706", fontWeight: "700" }}>
                          {a.half_day}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: "#1d4ed8", fontWeight: "700" }}>
                          {a.late}
                        </span>
                      </td>
                      <td style={styles.td}>{a.total_hours || 0}h</td>
                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 8,
                              backgroundColor: "#f1f5f9",
                              borderRadius: 4,
                              overflow: "hidden",
                              minWidth: 60,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${a.weightage || 0}%`,
                                backgroundColor: getWeightageColor(a.weightage),
                                borderRadius: 4,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: "700",
                              color: getWeightageColor(a.weightage),
                            }}
                          >
                            {a.weightage || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CHARTS ── */}
      {tab === "charts" && !loading && (
        <div style={styles.chartsGrid}>
          {/* Bar Chart — Employees by Department */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>👥 Employees by Department</h3>
            {deptStats.length === 0 ? (
              <div style={styles.noData}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptStats} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="department_name"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="total_employees"
                    name="Employees"
                    radius={[4, 4, 0, 0]}
                  >
                    {deptStats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie Chart — Department Headcount */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>🥧 Department Headcount</h3>
            {deptStats.length === 0 ? (
              <div style={styles.noData}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={deptStats.filter((d) => d.total_employees > 0)}
                    dataKey="total_employees"
                    nameKey="department_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {deptStats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart — Avg Salary */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>💰 Average Salary by Department</h3>
            {deptStats.length === 0 ? (
              <div style={styles.noData}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptStats} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="department_name"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `₹${Number(val).toLocaleString()}`,
                      "Avg Salary",
                    ]}
                  />
                  <Bar
                    dataKey="avg_salary"
                    name="Avg Salary"
                    fill="#1d4ed8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart — Total Salary Cost */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>
              📊 Total Salary Cost by Department
            </h3>
            {deptStats.length === 0 ? (
              <div style={styles.noData}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptStats} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="department_name"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `₹${Number(val).toLocaleString()}`,
                      "Total Salary",
                    ]}
                  />
                  <Bar
                    dataKey="total_salary"
                    name="Total Salary"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  </Layout>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", backgroundColor: "transparent", marginBottom: 20 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  backBtn: {
    padding: "8px 18px",
    backgroundColor: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tab: {
    padding: "8px 20px",
    backgroundColor: "#e2e8f0",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTab: { backgroundColor: "#1d4ed8", color: "#fff" },
  errorBox: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontWeight: "600",
  },
  loadingBox: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  exportBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  count: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  filterSelect: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1.5px solid #bfdbfe",
    fontSize: 14,
    backgroundColor: "#fff",
  },
  exportBtn: {
    padding: "8px 18px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
    marginLeft: "auto",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(29,78,216,0.08)",
    overflow: "auto",
    border: "1px solid #dbeafe",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1d4ed8" },
  th: {
    padding: "13px 16px",
    color: "#fff",
    textAlign: "left",
    fontSize: 13,
    fontWeight: "600",
  },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "12px 16px", fontSize: 14, color: "#1e293b" },
  empty: { padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 15 },
  empName: { fontWeight: "600", color: "#1e3a8a" },
  deptBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "600",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(420px,1fr))",
    gap: 20,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 2px 8px rgba(29,78,216,0.06)",
    border: "1px solid #dbeafe",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 16,
  },
  noData: { textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 },
};

export default Reports;
