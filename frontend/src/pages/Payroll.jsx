import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { handleApiError } from "../utils/apiError";
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
  CartesianGrid,
  Legend,
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
const MONTHS = [
  "",
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
];

function Payroll() {
  const [tab, setTab] = useState("generate");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payrollList, setPayrollList] = useState([]);
  const [stats, setStats] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: token };
      const [listRes, statsRes] = await Promise.all([
        axios.get(
          `http://localhost:5000/api/payroll/list?month=${month}&year=${year}`,
          { headers },
        ),
        axios.get(
          `http://localhost:5000/api/payroll/stats?month=${month}&year=${year}`,
          { headers },
        ),
      ]);
      setPayrollList(listRes.data);
      setStats(statsRes.data.stats);
      setDeptData(statsRes.data.deptBreakdown);
    } catch (err) {
      handleApiError(err, navigate);
    } finally {
      setLoading(false);
    }
  }, [month, year, token, navigate]);

  useEffect(() => {
    if (tab === "list" || tab === "analytics") fetchPayroll();
  }, [tab, fetchPayroll]);

  const handleGenerate = async () => {
    if (
      !window.confirm(
        `Generate payroll for ${MONTHS[month]} ${year}? This will process all employees.`,
      )
    )
      return;
    setGenerating(true);
   setResult(null);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/payroll/generate",
        { month, year },
        { headers: { Authorization: token } },
      );
      console.log(res.data);
      setResult(res.data);
    } catch (err) {
      handleApiError(err, navigate);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/payroll/mark-paid/${id}`,
        {},
        {
          headers: { Authorization: token },
        },
      );
      fetchPayroll();
    } catch (err) {
      handleApiError(err, navigate);
    }
  };

  const handleDownloadSlip = (id) => {
    window.open(
      `http://localhost:5000/api/payroll/slip/${id}?token=${token}`,
      "_blank",
    );
  };

  const getStatusStyle = (status) => {
    if (status === "paid")
      return { backgroundColor: "#dcfce7", color: "#059669" };
    if (status === "processed")
      return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    return { backgroundColor: "#fef3c7", color: "#d97706" };
  };

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>💰 Payroll Management</h1>
          <p style={styles.pageSub}>Process salaries and generate payslips</p>
        </div>
        <div style={styles.headerBtns}>
          <Link to="/my-payroll">
            <button style={styles.myBtn}>👤 My Payslips</button>
          </Link>
          <Link to="/dashboard">
            <button style={styles.backBtn}>← Dashboard</button>
          </Link>
        </div>
      </div>
      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: "generate", label: "⚙️ Generate Payroll" },
          { key: "list", label: "📋 Payroll List" },
          { key: "analytics", label: "📊 Analytics" },
        ].map((t) => (
          <button
            key={t.key}
            style={{
              ...styles.tab,
              ...(tab === t.key ? styles.activeTab : {}),
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* ── GENERATE TAB ── */}
      {tab === "generate" && (
        <div style={styles.generateCard}>
          <h2 style={styles.generateTitle}>Generate Monthly Payroll</h2>
          <p style={styles.generateSub}>
            Select month and year to process salaries for all employees.
            Attendance data will be used to calculate pro-rated salaries.
          </p>
          {result && (
  <div style={styles.resultCard}>
    <div style={styles.resultHeader}>
      ✅ Payroll Generated Successfully
    </div>

    <div style={styles.resultBody}>
      <p>
        <strong>Message:</strong> {result.message}
      </p>

      {result.totalEmployees && (
        <p>
          <strong>Total Employees:</strong>{" "}
          {result.totalEmployees}
        </p>
      )}

      {result.processed && (
        <p>
          <strong>Processed:</strong> {result.processed}
        </p>
      )}

      {result.month && (
        <p>
          <strong>Month:</strong>{" "}
          {MONTHS[result.month]} {result.year}
        </p>
      )}
    </div>
  </div>
)}

          <div style={styles.generateForm}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Month</label>
              <select
                style={styles.select}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {MONTHS.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Year</label>
              <select
                style={styles.select}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              style={{ ...styles.generateBtn, opacity: generating ? 0.7 : 1 }}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "⏳ Processing..." : "⚙️ Generate Payroll"}
            </button>
          </div>

          {/* How it works */}
          <div style={styles.infoGrid}>
            {[
              
              {
                icon: "📊",
                title: "Attendance based",
                desc: "Salary calculated based on present days vs working days (26)",
              },
              {
                icon: "💼",
                title: "Auto components",
                desc: "Basic, HRA, Transport, Medical, PF, TDS calculated automatically",
              },
              {
                icon: "📄",
                title: "PDF payslips",
                desc: "Professional salary slip generated instantly for each employee",
              },
              {
                icon: "✅",
                title: "Mark as paid",
                desc: "Track payment status — Draft → Processed → Paid",
              },
            ].map((item) => (
              <div key={item.title} style={styles.infoCard}>
                <div style={styles.infoIcon}>{item.icon}</div>
                <div style={styles.infoTitle}>{item.title}</div>
                <div style={styles.infoDesc}>{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Salary formula */}
          <div style={styles.formulaCard}>
            <h3 style={styles.formulaTitle}>📐 Salary Calculation Formula</h3>
            <div style={styles.formulaGrid}>
              <div style={styles.formulaItem}>
                <div style={styles.formulaLabel}>Basic Salary</div>
                <div style={styles.formulaValue}>50% of CTC</div>
              </div>
              <div style={styles.formulaItem}>
                <div style={styles.formulaLabel}>HRA</div>
                <div style={styles.formulaValue}>20% of CTC</div>
              </div>
              <div style={styles.formulaItem}>
                <div style={styles.formulaLabel}>Transport</div>
                <div style={styles.formulaValue}>₹1,500 fixed</div>
              </div>
              <div style={styles.formulaItem}>
                <div style={styles.formulaLabel}>Medical</div>
                <div style={styles.formulaValue}>₹1,250 fixed</div>
              </div>
              <div style={{ ...styles.formulaItem, borderColor: "#fecaca" }}>
                <div style={{ ...styles.formulaLabel, color: "#dc2626" }}>
                  PF
                </div>
                <div style={styles.formulaValue}>12% of Basic</div>
              </div>
              <div style={{ ...styles.formulaItem, borderColor: "#fecaca" }}>
                <div style={{ ...styles.formulaLabel, color: "#dc2626" }}>
                  TDS
                </div>
                <div style={styles.formulaValue}>10% of Gross</div>
              </div>
              <div style={{ ...styles.formulaItem, borderColor: "#fecaca" }}>
                <div style={{ ...styles.formulaLabel, color: "#dc2626" }}>
                  ESI
                </div>
                <div style={styles.formulaValue}>0.75% of Gross</div>
              </div>
              <div style={{ ...styles.formulaItem, borderColor: "#fecaca" }}>
                <div style={{ ...styles.formulaLabel, color: "#dc2626" }}>
                  Prof Tax
                </div>
                <div style={styles.formulaValue}>₹200 fixed</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── LIST TAB ── */}
      {tab === "list" && (
        <>
          <div style={styles.filterRow}>
            <select
              style={styles.filterSelect}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTHS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              style={styles.filterSelect}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {stats && (
              <div style={styles.quickStats}>
                <span style={styles.qStat}>
                  👥 {stats.total_employees} employees
                </span>
                <span style={styles.qStat}>
                  💰 ₹{Number(stats.total_net).toLocaleString()} total
                </span>
                <span style={{ ...styles.qStat, color: "#059669" }}>
                  ✅ {stats.paid_count} paid
                </span>
                <span style={{ ...styles.qStat, color: "#d97706" }}>
                  ⏳ {stats.pending_count} pending
                </span>
              </div>
            )}
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Days</th>
                  <th style={styles.th}>Gross</th>
                  <th style={styles.th}>Deductions</th>
                  <th style={styles.th}>Net Salary</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={styles.empty}>
                      Loading...
                    </td>
                  </tr>
                ) : payrollList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={styles.empty}>
                      No payroll for {MONTHS[month]} {year}.
                      <button
                        style={styles.inlineBtn}
                        onClick={() => setTab("generate")}
                      >
                        Generate now →
                      </button>
                    </td>
                  </tr>
                ) : (
                  payrollList.map((p, i) => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.empAvatar}>
                          <div style={styles.avatarCircle}>
                            {p.name?.charAt(0)}
                          </div>
                          <div>
                            <div style={styles.empName}>{p.name}</div>
                            <div style={styles.empSub}>{p.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.deptBadge}>
                          {p.department_name}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {p.present_days}/{p.working_days}
                      </td>
                      <td style={styles.td}>
                        ₹{Number(p.gross_salary).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: "#dc2626" }}>
                          -₹{Number(p.total_deductions).toLocaleString()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <strong style={{ color: "#059669", fontSize: 15 }}>
                          ₹{Number(p.net_salary).toLocaleString()}
                        </strong>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...getStatusStyle(p.status),
                          }}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button
                            style={styles.slipBtn}
                            onClick={() => handleDownloadSlip(p.id)}
                          >
                            📄 Slip
                          </button>
                          {p.status === "processed" && (
                            <button
                              style={styles.paidBtn}
                              onClick={() => handleMarkPaid(p.id)}
                            >
                              ✅ Paid
                            </button>
                          )}
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
      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && (
        <>
          <div style={styles.filterRow}>
            <select
              style={styles.filterSelect}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTHS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              style={styles.filterSelect}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {stats && (
            <div style={styles.statsGrid}>
              {[
                {
                  label: "Total Gross",
                  value: `₹${Number(stats.total_gross).toLocaleString()}`,
                  bg: "#1d4ed8",
                },
                {
                  label: "Total Net",
                  value: `₹${Number(stats.total_net).toLocaleString()}`,
                  bg: "#059669",
                },
                {
                  label: "Total Deductions",
                  value: `₹${Number(stats.total_deductions).toLocaleString()}`,
                  bg: "#dc2626",
                },
                {
                  label: "Employees",
                  value: stats.total_employees,
                  bg: "#d97706",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{ ...styles.statCard, borderTop: `4px solid ${s.bg}` }}
                >
                  <div style={{ fontSize: 22, fontWeight: "700", color: s.bg }}>
                    {s.value}
                  </div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.chartsRow}>
            {/* Dept Net Salary Bar */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>🏬 Net Salary by Department</h3>
              {deptData.length === 0 ? (
                <div style={styles.noData}>No payroll data for this month</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={deptData} margin={{ bottom: 40 }}>
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
                      formatter={(v) => [
                        `₹${Number(v).toLocaleString()}`,
                        "Net Salary",
                      ]}
                    />
                    <Bar dataKey="total_net" radius={[4, 4, 0, 0]}>
                      {deptData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Salary Distribution Pie */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>🥧 Salary Distribution</h3>
              {deptData.length === 0 ? (
                <div style={styles.noData}>No payroll data for this month</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={deptData}
                      dataKey="total_net"
                      nameKey="department_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {deptData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => `₹${Number(v).toLocaleString()}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Per employee breakdown */}
          {payrollList.length > 0 && (
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>👥 Employee Salary Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={payrollList.map((p) => ({
                    name: p.name.split(" ")[0],
                    gross: p.gross_salary,
                    net: p.net_salary,
                    deduction: p.total_deductions,
                  }))}
                  margin={{ bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v) => `₹${Number(v).toLocaleString()}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="gross"
                    name="Gross"
                    fill="#1d4ed8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="net"
                    name="Net"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="deduction"
                    name="Deductions"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  </Layout>
  );
}

const styles = {
  resultCard: {
  backgroundColor: "#ecfdf5",
  border: "1px solid #bbf7d0",
  borderRadius: 12,
  padding: 18,
  marginBottom: 24,
},

resultHeader: {
  fontSize: 16,
  fontWeight: "700",
  color: "#059669",
  marginBottom: 10,
},

resultBody: {
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.8,
},
 wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", backgroundColor: "transparent", marginBottom: 20 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  headerBtns: { display: "flex", gap: 10 },
  backBtn: {
    padding: "8px 18px",
    backgroundColor: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
  },
  myBtn: {
    padding: "8px 18px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "10px 24px",
    backgroundColor: "#e2e8f0",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTab: { backgroundColor: "#1d4ed8", color: "#fff" },
  generateCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    border: "1px solid #dbeafe",
    boxShadow: "0 2px 8px rgba(29,78,216,0.08)",
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  generateSub: { fontSize: 14, color: "#64748b", marginBottom: 28 },
  generateForm: {
    display: "flex",
    gap: 16,
    alignItems: "flex-end",
    marginBottom: 32,
    flexWrap: "wrap",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  select: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1.5px solid #bfdbfe",
    fontSize: 14,
    backgroundColor: "#f8fafc",
    minWidth: 160,
  },
  generateBtn: {
    padding: "12px 28px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: "700",
    cursor: "pointer",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: 16,
    marginBottom: 28,
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 16,
    border: "1px solid #dbeafe",
    textAlign: "center",
  },
  infoIcon: { fontSize: 28, marginBottom: 8 },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  infoDesc: { fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  formulaCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 20,
    border: "1px solid #dbeafe",
  },
  formulaTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 16,
  },
  formulaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: 10,
  },
  formulaItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    textAlign: "center",
    border: "1px solid #dbeafe",
  },
  formulaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
  },
  formulaValue: { fontSize: 13, color: "#374151" },
  filterRow: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterSelect: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1.5px solid #bfdbfe",
    fontSize: 14,
    backgroundColor: "#fff",
  },
  quickStats: {
    display: "flex",
    gap: 16,
    marginLeft: "auto",
    flexWrap: "wrap",
  },
  qStat: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "16px 20px",
    border: "1px solid #dbeafe",
    boxShadow: "0 2px 6px rgba(29,78,216,0.06)",
  },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
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
    padding: "13px 14px",
    color: "#fff",
    textAlign: "left",
    fontSize: 12,
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "12px 14px", fontSize: 13, verticalAlign: "middle" },
  empty: { padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 15 },
  empAvatar: { display: "flex", alignItems: "center", gap: 10 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 0,
  },
  empName: { fontWeight: "600", color: "#1e3a8a", fontSize: 13 },
  empSub: { fontSize: 11, color: "#94a3b8" },
  deptBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: "600",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "700",
  },
  actionBtns: { display: "flex", gap: 6 },
  slipBtn: {
    padding: "5px 10px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: "600",
  },
  paidBtn: {
    padding: "5px 10px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: "600",
  },
  inlineBtn: {
    marginLeft: 12,
    padding: "4px 12px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #dbeafe",
    boxShadow: "0 2px 8px rgba(29,78,216,0.06)",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 16,
  },
  noData: { textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 },
};

export default Payroll;
