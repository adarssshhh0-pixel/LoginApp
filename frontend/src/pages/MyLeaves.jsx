import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/leave/my-leaves", {
          headers: { Authorization: token },
        });
        setLeaves(res.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    fetchLeaves();
  }, [token, navigate]);

  const getStatusStyle = (status) => {
    if (status === "approved") return { backgroundColor: "#dcfce7", color: "#059669" };
    if (status === "rejected") return { backgroundColor: "#fee2e2", color: "#dc2626" };
    return { backgroundColor: "#fef3c7", color: "#d97706" };
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>📋 My Leave Applications</h1>
          <p style={styles.pageSub}>Track all your leave requests</p>
        </div>
        <div style={styles.headerBtns}>
          <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
          <Link to="/apply-leave"><button style={styles.applyBtn}>➕ Apply Leave</button></Link>
        </div>
      </div>

      <div style={styles.statsRow}>
        {[
          { label: "Total",    value: leaves.length,                                        bg: "#1d4ed8" },
          { label: "Pending",  value: leaves.filter(l => l.status === "pending").length,   bg: "#d97706" },
          { label: "Approved", value: leaves.filter(l => l.status === "approved").length,  bg: "#059669" },
          { label: "Rejected", value: leaves.filter(l => l.status === "rejected").length,  bg: "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.bg}` }}>
            <div style={{ fontSize: 28, fontWeight: "700", color: s.bg }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Leave Type</th>
              <th style={styles.th}>From</th>
              <th style={styles.th}>To</th>
              <th style={styles.th}>Days</th>
              <th style={styles.th}>Reason</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Applied On</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr><td colSpan={8} style={styles.empty}>No leave applications yet. <Link to="/apply-leave" style={{ color: "#1d4ed8" }}>Apply now</Link></td></tr>
            ) : (
              leaves.map((l, i) => (
                <tr key={l.id} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}><span style={styles.leaveType}>{l.leave_name}</span></td>
                  <td style={styles.td}>{new Date(l.from_date).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}>{new Date(l.to_date).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}><span style={styles.daysBadge}>{l.total_days}d</span></td>
                  <td style={styles.td}>{l.reason}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, ...getStatusStyle(l.status) }}>{l.status.toUpperCase()}</span></td>
                  <td style={styles.td}>{new Date(l.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
  applyBtn: { padding: "8px 18px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 24 },
  statCard: { backgroundColor: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #dbeafe", boxShadow: "0 2px 6px rgba(29,78,216,0.06)" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(29,78,216,0.08)", overflow: "auto", border: "1px solid #dbeafe" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1d4ed8" },
  th: { padding: "13px 16px", color: "#fff", textAlign: "left", fontSize: 13, fontWeight: "600" },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "12px 16px", fontSize: 14, color: "#1e293b" },
  empty: { padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 15 },
  leaveType: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: "600" },
  daysBadge: { backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: "700" },
  badge: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: "600" },
};

export default MyLeaves;