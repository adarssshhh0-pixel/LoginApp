import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid } from "recharts";

function MyAttendance() {
  const [records, setRecords]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/attendance/my", {
          headers: { Authorization: token },
        });
        setRecords(res.data);

        // Calculate summary
        const present  = res.data.filter(r => r.status === "present").length;
        const absent   = res.data.filter(r => r.status === "absent").length;
        const halfDay  = res.data.filter(r => r.status === "half_day").length;
        const late     = res.data.filter(r => r.status === "late").length;
        const total    = res.data.length;
        const weightage = total > 0
          ? ((present * 1.0 + late * 0.75 + halfDay * 0.5) / total * 100).toFixed(1)
          : 0;

        setSummary({ present, absent, halfDay, late, total, weightage });
      } catch (err) { handleApiError(err, navigate); }
    };
    fetch();
  }, [token, navigate]);

  const getStatusStyle = (status) => {
    if (status === "present")  return { backgroundColor: "#dcfce7", color: "#059669" };
    if (status === "absent")   return { backgroundColor: "#fee2e2", color: "#dc2626" };
    if (status === "half_day") return { backgroundColor: "#fef3c7", color: "#d97706" };
    if (status === "late")     return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    return {};
  };

  const chartData = records.slice(0, 20).reverse().map(r => ({
    date:  new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    hours: parseFloat(r.working_hours) || 0,
    status: r.status,
  }));

  const getBarColor = (status) => {
    if (status === "present")  return "#059669";
    if (status === "absent")   return "#dc2626";
    if (status === "half_day") return "#d97706";
    if (status === "late")     return "#1d4ed8";
    return "#94a3b8";
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>👤 My Attendance</h1>
          <p style={styles.pageSub}>Your attendance records and statistics</p>
        </div>
        <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div style={styles.statsGrid}>
            {[
              { label: "Present",     value: summary.present,  bg: "#059669" },
              { label: "Absent",      value: summary.absent,   bg: "#dc2626" },
              { label: "Half Day",    value: summary.halfDay,  bg: "#d97706" },
              { label: "Late",        value: summary.late,     bg: "#1d4ed8" },
            ].map(s => (
              <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.bg}` }}>
                <div style={{ fontSize: 28, fontWeight: "700", color: s.bg }}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Weightage Card */}
          <div style={styles.weightageCard}>
            <div style={styles.weightageLeft}>
              <div style={styles.weightageTitle}>⚖️ My Attendance Weightage</div>
              <div style={styles.weightageDesc}>Based on last {summary.total} recorded days</div>
              <div style={styles.weightageFormula}>Present=100% • Late=75% • Half Day=50% • Absent=0%</div>
            </div>
            <div style={styles.weightageRight}>
              <div style={{ fontSize: 52, fontWeight: "800", color: summary.weightage >= 75 ? "#059669" : "#dc2626" }}>
                {summary.weightage}%
              </div>
              <div style={styles.weightageStatus}>
                {summary.weightage >= 90 ? "🌟 Excellent"  :
                 summary.weightage >= 75 ? "✅ Good"       :
                 summary.weightage >= 50 ? "⚠️ Average"   : "❌ Poor"}
              </div>
            </div>
          </div>

          {/* Working Hours Chart */}
          {chartData.length > 0 && (
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>📊 Daily Working Hours (Last 20 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                  <YAxis domain={[0, 10]} tickFormatter={v => `${v}h`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => [`${val}h`, "Working Hours"]} />
                  <Bar dataKey="hours" radius={[4,4,0,0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={styles.legend}>
                {[["#059669","Present"],["#dc2626","Absent"],["#d97706","Half Day"],["#1d4ed8","Late"]].map(([c,l]) => (
                  <div key={l} style={styles.legendItem}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
                    <span style={{ fontSize: 12, color: "#64748b" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Records Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.chartTitle}>📋 Attendance Records</h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Day</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Check In</th>
                <th style={styles.th}>Check Out</th>
                <th style={styles.th}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} style={styles.empty}>No attendance records found.</td></tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                    <td style={styles.td}>{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short" })}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...getStatusStyle(r.status) }}>
                        {r.status?.replace("_"," ").toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>{r.check_in || "—"}</td>
                    <td style={styles.td}>{r.check_out || "—"}</td>
                    <td style={styles.td}><span style={styles.hoursBadge}>{r.working_hours || 0}h</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 32, backgroundColor: "#eff6ff", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 20 },
  statCard: { backgroundColor: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #dbeafe", boxShadow: "0 2px 6px rgba(29,78,216,0.06)" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  weightageCard: { backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.06)", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" },
  weightageLeft: {},
  weightageTitle: { fontSize: 16, fontWeight: "700", color: "#1e3a8a", marginBottom: 4 },
  weightageDesc: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  weightageFormula: { fontSize: 12, color: "#94a3b8" },
  weightageRight: { textAlign: "center" },
  weightageStatus: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  chartCard: { backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.06)", marginBottom: 20 },
  chartTitle: { fontSize: 15, fontWeight: "700", color: "#1e3a8a", margin: "0 0 16px" },
  legend: { display: "flex", gap: 16, marginTop: 12, justifyContent: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  tableCard: { backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.06)" },
  tableWrapper: { overflow: "auto", borderRadius: 8, border: "1px solid #dbeafe" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1d4ed8" },
  th: { padding: "12px 14px", color: "#fff", textAlign: "left", fontSize: 12, fontWeight: "600" },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "10px 14px", fontSize: 13 },
  empty: { padding: 40, textAlign: "center", color: "#94a3b8" },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: "700" },
  hoursBadge: { backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: "700" },
};

export default MyAttendance;