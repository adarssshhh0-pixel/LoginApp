import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function LeaveApproval() {
  const [leaves, setLeaves]   = useState([]);
  const [stats, setStats]     = useState(null);
  const [remarks, setRemarks] = useState({});
  const [filter, setFilter]   = useState("all");
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const headers = { Authorization: token };
      const [leavesRes, statsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/leave/all",   { headers }),
        axios.get("http://localhost:5000/api/leave/stats", { headers }),
      ]);
      setLeaves(leavesRes.data);
      setStats(statsRes.data);
    } catch (err) { handleApiError(err, navigate); }
  };

  useEffect(() => { fetchData(); }, [token, navigate]);

  const handleAction = async (id, action) => {
    try {
      await axios.put(
        `http://localhost:5000/api/leave/action/${id}`,
        { action, remarks: remarks[id] || "" },
        { headers: { Authorization: token } }
      );
      alert(`Leave ${action} successfully!`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Action failed");
    }
  };

  const getStatusStyle = (status) => {
    if (status === "approved") return { backgroundColor: "#dcfce7", color: "#059669" };
    if (status === "rejected") return { backgroundColor: "#fee2e2", color: "#dc2626" };
    return { backgroundColor: "#fef3c7", color: "#d97706" };
  };

  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>✅ Leave Approval Panel</h1>
          <p style={styles.pageSub}>Review and manage employee leave requests</p>
        </div>
        <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
      </div>

      {stats && (
        <div style={styles.statsGrid}>
          {[
            { label: "Total",    value: stats.total,    bg: "#1d4ed8" },
            { label: "Pending",  value: stats.pending,  bg: "#d97706" },
            { label: "Approved", value: stats.approved, bg: "#059669" },
            { label: "Rejected", value: stats.rejected, bg: "#dc2626" },
          ].map(s => (
            <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.bg}` }}>
              <div style={{ fontSize: 28, fontWeight: "700", color: s.bg }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.filterRow}>
        {["all","pending","approved","rejected"].map(f => (
          <button key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={styles.filterCount}>{filtered.length} records</span>
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
              <th style={styles.th}>Reason</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Remarks</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={styles.empty}>No leave applications found.</td></tr>
            ) : (
              filtered.map((l, i) => (
                <tr key={l.id} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: "600", color: "#1e3a8a" }}>{l.employee_name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{l.email}</div>
                  </td>
                  <td style={styles.td}><span style={styles.leaveType}>{l.leave_name}</span></td>
                  <td style={styles.td}>{new Date(l.from_date).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}>{new Date(l.to_date).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}><span style={styles.daysBadge}>{l.total_days}d</span></td>
                  <td style={styles.td}>{l.reason}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, ...getStatusStyle(l.status) }}>{l.status.toUpperCase()}</span></td>
                  <td style={styles.td}>
                    {l.status === "pending" && (
                      <input style={styles.remarkInput} placeholder="Remarks..." value={remarks[l.id] || ""} onChange={(e) => setRemarks({ ...remarks, [l.id]: e.target.value })} />
                    )}
                  </td>
                  <td style={styles.td}>
                    {l.status === "pending" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button style={styles.approveBtn} onClick={() => handleAction(l.id, "approved")}>✅ Approve</button>
                        <button style={styles.rejectBtn}  onClick={() => handleAction(l.id, "rejected")}>❌ Reject</button>
                      </div>
                    ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>Processed</span>}
                  </td>
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
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 20 },
  statCard: { backgroundColor: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #dbeafe", boxShadow: "0 2px 6px rgba(29,78,216,0.06)" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  filterRow: { display: "flex", gap: 8, marginBottom: 16, alignItems: "center" },
  filterBtn: { padding: "7px 16px", border: "1.5px solid #bfdbfe", borderRadius: 8, backgroundColor: "#fff", color: "#1e40af", fontSize: 13, fontWeight: "600", cursor: "pointer" },
  filterActive: { backgroundColor: "#1d4ed8", color: "#fff", borderColor: "#1d4ed8" },
  filterCount: { marginLeft: "auto", fontSize: 13, color: "#64748b" },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(29,78,216,0.08)", overflow: "auto", border: "1px solid #dbeafe" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1d4ed8" },
  th: { padding: "13px 14px", color: "#fff", textAlign: "left", fontSize: 12, fontWeight: "600", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "12px 14px", fontSize: 13, verticalAlign: "middle", color: "#1e293b" },
  empty: { padding: 48, textAlign: "center", color: "#94a3b8" },
  leaveType: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: "600" },
  daysBadge: { backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: "700" },
  badge: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: "600" },
  remarkInput: { padding: "6px 10px", borderRadius: 6, border: "1.5px solid #bfdbfe", fontSize: 12, width: 130, fontFamily: "inherit" },
  approveBtn: { padding: "5px 10px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "600" },
  rejectBtn: { padding: "5px 10px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "600" },
};

export default LeaveApproval;