import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const COLORS = ["#059669", "#dc2626", "#d97706", "#f59e0b"];
const STATUS_COLORS = {
  present:  { bg: "#dcfce7", color: "#059669", label: "Present" },
  absent:   { bg: "#fee2e2", color: "#dc2626", label: "Absent"  },
  half_day: { bg: "#fef3c7", color: "#d97706", label: "Half Day"},
  late:     { bg: "#dbeafe", color: "#1d4ed8", label: "Late"    },
};

function Attendance() {
  const [tab, setTab]               = useState("mark");
  const [date, setDate]             = useState(new Date().toISOString().split("T")[0]);
  const [employees, setEmployees]   = useState([]);
  const [attendance, setAttendance] = useState({});
  const [stats, setStats]           = useState(null);
  const [weightage, setWeightage]   = useState([]);
  const [month, setMonth]           = useState(new Date().getMonth() + 1);
  const [year, setYear]             = useState(new Date().getFullYear());
  const [saving, setSaving]         = useState(false);
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch employees for marking
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/attendance/date/${date}`, {
          headers: { Authorization: token },
        });
        setEmployees(res.data);
        // Pre-fill existing attendance
        const existing = {};
        res.data.forEach(e => {
          existing[e.employee_id] = {
            status:    e.status    || "present",
            check_in:  e.check_in  || "09:00",
            check_out: e.check_out || "18:00",
          };
        });
        setAttendance(existing);
      } catch (err) { handleApiError(err, navigate); }
    };
    if (tab === "mark") fetchEmployees();
  }, [date, tab, token, navigate]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, weightRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/attendance/stats?month=${month}&year=${year}`, { headers: { Authorization: token } }),
          axios.get(`http://localhost:5000/api/attendance/weightage?month=${month}&year=${year}`, { headers: { Authorization: token } }),
        ]);
        setStats(statsRes.data);
        setWeightage(weightRes.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    if (tab === "analytics") fetchStats();
  }, [tab, month, year, token, navigate]);

  const handleStatusChange = (empId, field, value) => {
    setAttendance(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value },
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    employees.forEach(e => {
      updated[e.employee_id] = {
        status,
        check_in:  status === "absent" ? "" : "09:00",
        check_out: status === "absent" ? "" : "18:00",
      };
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = employees.map(e => ({
        employee_id: e.employee_id,
        status:      attendance[e.employee_id]?.status    || "present",
        check_in:    attendance[e.employee_id]?.check_in  || null,
        check_out:   attendance[e.employee_id]?.check_out || null,
      }));
      await axios.post("http://localhost:5000/api/attendance/mark",
        { records, date },
        { headers: { Authorization: token } }
      );
      alert("✅ Attendance saved successfully!");
    } catch (err) { handleApiError(err, navigate); }
    finally { setSaving(false); }
  };

  const getWeightageColor = (w) => {
    if (w >= 90) return "#059669";
    if (w >= 75) return "#d97706";
    if (w >= 50) return "#f59e0b";
    return "#dc2626";
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>📅 Attendance Management</h1>
          <p style={styles.pageSub}>Mark and track employee attendance</p>
        </div>
        <div style={styles.headerBtns}>
          <Link to="/my-attendance"><button style={styles.myAttBtn}>👤 My Attendance</button></Link>
          <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["mark", "analytics"].map(t => (
          <button key={t}
            style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}
            onClick={() => setTab(t)}>
            {t === "mark"      && "✏️ Mark Attendance"}
            {t === "analytics" && "📊 Analytics & Weightage"}
          </button>
        ))}
      </div>

      {/* ── MARK ATTENDANCE TAB ── */}
      {tab === "mark" && (
        <div style={styles.card}>
          {/* Date + bulk actions */}
          <div style={styles.markHeader}>
            <div style={styles.dateRow}>
              <label style={styles.label}>Select Date</label>
              <input
                type="date"
                style={styles.dateInput}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div style={styles.bulkBtns}>
              <span style={styles.bulkLabel}>Mark All:</span>
              {["present","absent","half_day","late"].map(s => (
                <button key={s}
                  style={{ ...styles.bulkBtn, backgroundColor: STATUS_COLORS[s].bg, color: STATUS_COLORS[s].color }}
                  onClick={() => handleMarkAll(s)}>
                  {STATUS_COLORS[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Check In</th>
                  <th style={styles.th}>Check Out</th>
                  <th style={styles.th}>Hours</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => {
                  const att = attendance[emp.employee_id] || { status: "present", check_in: "09:00", check_out: "18:00" };
                  const hours = att.check_in && att.check_out
                    ? (((parseInt(att.check_out) * 60 + parseInt(att.check_out?.split(":")[1])) -
                       (parseInt(att.check_in) * 60 + parseInt(att.check_in?.split(":")[1]))) / 60).toFixed(1)
                    : att.status === "present" ? "8.0" : "0.0";

                  return (
                    <tr key={emp.employee_id} style={styles.tr}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.empAvatar}>
                          <div style={styles.avatarCircle}>
                            {emp.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.empName}>{emp.name}</div>
                            <div style={styles.empEmail}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.deptBadge}>{emp.department_name || "—"}</span>
                      </td>
                      <td style={styles.td}>
                        <select
                          style={{ ...styles.statusSelect, backgroundColor: STATUS_COLORS[att.status]?.bg, color: STATUS_COLORS[att.status]?.color }}
                          value={att.status}
                          onChange={(e) => handleStatusChange(emp.employee_id, "status", e.target.value)}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                          <option value="late">Late</option>
                        </select>
                      </td>
                      <td style={styles.td}>
                        {att.status !== "absent" ? (
                          <input type="time" style={styles.timeInput}
                            value={att.check_in || "09:00"}
                            onChange={(e) => handleStatusChange(emp.employee_id, "check_in", e.target.value)} />
                        ) : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={styles.td}>
                        {att.status !== "absent" ? (
                          <input type="time" style={styles.timeInput}
                            value={att.check_out || "18:00"}
                            onChange={(e) => handleStatusChange(emp.employee_id, "check_out", e.target.value)} />
                        ) : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.hoursBadge}>{hours}h</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div style={styles.saveRow}>
            <span style={styles.saveInfo}>
              {employees.length} employees • {date}
            </span>
            <button style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && (
        <div>
          {/* Month/Year Filter */}
          <div style={styles.filterRow}>
            <select style={styles.filterSelect} value={month} onChange={(e) => setMonth(e.target.value)}>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => (
                <option key={i} value={i+1}>{m}</option>
              ))}
            </select>
            <select style={styles.filterSelect} value={year} onChange={(e) => setYear(e.target.value)}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {stats && (
            <>
              {/* Today's Stats */}
              <div style={styles.statsGrid}>
                {[
                  { label: "Present Today",  value: stats.today?.present  || 0, bg: "#059669" },
                  { label: "Absent Today",   value: stats.today?.absent   || 0, bg: "#dc2626" },
                  { label: "Half Day Today", value: stats.today?.half_day || 0, bg: "#d97706" },
                  { label: "Late Today",     value: stats.today?.late     || 0, bg: "#1d4ed8" },
                ].map(s => (
                  <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.bg}` }}>
                    <div style={{ fontSize: 28, fontWeight: "700", color: s.bg }}>{s.value}</div>
                    <div style={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div style={styles.chartsRow}>

                {/* Daily Attendance Line Chart */}
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>📈 Daily Attendance — {month}/{year}</h3>
                  {stats.daily.length === 0 ? (
                    <div style={styles.noData}>No attendance data for this month</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={stats.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tickFormatter={d => new Date(d).getDate()} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip labelFormatter={d => `Date: ${d}`} />
                        <Legend />
                        <Line type="monotone" dataKey="present"  stroke="#059669" strokeWidth={2} dot={false} name="Present" />
                        <Line type="monotone" dataKey="absent"   stroke="#dc2626" strokeWidth={2} dot={false} name="Absent" />
                        <Line type="monotone" dataKey="half_day" stroke="#d97706" strokeWidth={2} dot={false} name="Half Day" />
                        <Line type="monotone" dataKey="late"     stroke="#1d4ed8" strokeWidth={2} dot={false} name="Late" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Pie Chart */}
                {stats.today?.total > 0 && (
                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>🥧 Today's Overview</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Present",  value: parseInt(stats.today.present)  || 0 },
                            { name: "Absent",   value: parseInt(stats.today.absent)   || 0 },
                            { name: "Half Day", value: parseInt(stats.today.half_day) || 0 },
                            { name: "Late",     value: parseInt(stats.today.late)     || 0 },
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" outerRadius={90}
                          dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        >
                          {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Weightage Bar Chart */}
              <div style={styles.chartCardFull}>
                <h3 style={styles.chartTitle}>⚖️ Employee Attendance Weightage (%) — {month}/{year}</h3>
                <p style={styles.chartSub}>Present=100% • Late=75% • Half Day=50% • Absent=0%</p>
                {weightage.length === 0 ? (
                  <div style={styles.noData}>No weightage data for this month</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={weightage} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val) => [`${val}%`, "Weightage"]} />
                      <Bar dataKey="weightage" radius={[6,6,0,0]} name="Weightage %">
                        {weightage.map((entry, i) => (
                          <Cell key={i} fill={getWeightageColor(entry.weightage)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Per Employee Table */}
              <div style={styles.card}>
                <h3 style={styles.chartTitle}>👥 Employee Wise Report</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Employee</th>
                        <th style={styles.th}>Department</th>
                        <th style={styles.th}>Present</th>
                        <th style={styles.th}>Absent</th>
                        <th style={styles.th}>Half Day</th>
                        <th style={styles.th}>Late</th>
                        <th style={styles.th}>Avg Hours</th>
                        <th style={styles.th}>Weightage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weightage.map((w, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.empAvatar}>
                              <div style={{ ...styles.avatarCircle, backgroundColor: getWeightageColor(w.weightage) }}>
                                {w.name?.charAt(0)}
                              </div>
                              <div>
                                <div style={styles.empName}>{w.name}</div>
                                <div style={styles.empEmail}>{w.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}><span style={styles.deptBadge}>{w.department_name || "—"}</span></td>
                          <td style={styles.td}><span style={{ color: "#059669", fontWeight: "700" }}>{w.present}</span></td>
                          <td style={styles.td}><span style={{ color: "#dc2626", fontWeight: "700" }}>{w.absent}</span></td>
                          <td style={styles.td}><span style={{ color: "#d97706", fontWeight: "700" }}>{w.half_day}</span></td>
                          <td style={styles.td}><span style={{ color: "#1d4ed8", fontWeight: "700" }}>{w.late}</span></td>
                          <td style={styles.td}>{w.avg_hours || 0}h</td>
                          <td style={styles.td}>
                            <div style={styles.weightageCell}>
                              <div style={styles.progressBg}>
                                <div style={{ ...styles.progressFill, width: `${w.weightage || 0}%`, backgroundColor: getWeightageColor(w.weightage) }} />
                              </div>
                              <span style={{ ...styles.weightagePct, color: getWeightageColor(w.weightage) }}>
                                {w.weightage || 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 32, backgroundColor: "#eff6ff", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  headerBtns: { display: "flex", gap: 10 },
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  myAttBtn: { padding: "8px 18px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: { padding: "10px 24px", backgroundColor: "#e2e8f0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "600" },
  activeTab: { backgroundColor: "#1d4ed8", color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.08)", marginBottom: 20 },
  markHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  dateRow: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  dateInput: { padding: "8px 14px", borderRadius: 8, border: "1.5px solid #bfdbfe", fontSize: 14, backgroundColor: "#f8fafc" },
  bulkBtns: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  bulkLabel: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  bulkBtn: { padding: "6px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "700" },
  tableWrapper: { overflow: "auto", borderRadius: 8, border: "1px solid #dbeafe" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1d4ed8" },
  th: { padding: "12px 14px", color: "#fff", textAlign: "left", fontSize: 12, fontWeight: "600", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "10px 14px", fontSize: 13, verticalAlign: "middle" },
  empAvatar: { display: "flex", alignItems: "center", gap: 10 },
  avatarCircle: { width: 36, height: 36, borderRadius: "50%", backgroundColor: "#1d4ed8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "700", flexShrink: 0 },
  empName: { fontWeight: "600", color: "#1e3a8a", fontSize: 13 },
  empEmail: { fontSize: 11, color: "#94a3b8" },
  deptBadge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: "600" },
  statusSelect: { padding: "6px 10px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: "700", cursor: "pointer" },
  timeInput: { padding: "6px 8px", borderRadius: 6, border: "1.5px solid #bfdbfe", fontSize: 12, backgroundColor: "#f8fafc" },
  hoursBadge: { backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: "700" },
  saveRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #dbeafe" },
  saveInfo: { fontSize: 13, color: "#64748b" },
  saveBtn: { padding: "12px 28px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "700", cursor: "pointer" },
  filterRow: { display: "flex", gap: 12, marginBottom: 20 },
  filterSelect: { padding: "8px 14px", borderRadius: 8, border: "1.5px solid #bfdbfe", fontSize: 14, backgroundColor: "#fff" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 20 },
  statCard: { backgroundColor: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #dbeafe", boxShadow: "0 2px 6px rgba(29,78,216,0.06)" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  chartsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 },
  chartCard: { backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.06)" },
  chartCardFull: { backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.06)", marginBottom: 20 },
  chartTitle: { fontSize: 15, fontWeight: "700", color: "#1e3a8a", margin: "0 0 4px" },
  chartSub: { fontSize: 12, color: "#94a3b8", marginBottom: 16 },
  noData: { textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 },
  weightageCell: { display: "flex", alignItems: "center", gap: 8 },
  progressBg: { flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden", minWidth: 60 },
  progressFill: { height: "100%", borderRadius: 4, transition: "width 0.3s" },
  weightagePct: { fontSize: 13, fontWeight: "700", minWidth: 40 },
};

export default Attendance;