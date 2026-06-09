import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function LeaveBalance() {
  const [balance, setBalance] = useState([]);
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/leave/balance", {
          headers: { Authorization: token },
        });
        setBalance(res.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    fetchBalance();
  }, [token, navigate]);

  const colors = ["#1d4ed8","#059669","#d97706","#0891b2"];

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>🏖️ My Leave Balance</h1>
          <p style={styles.pageSub}>Overview of your available and used leave days</p>
        </div>
        <div style={styles.headerBtns}>
          <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
          <Link to="/apply-leave"><button style={styles.applyBtn}>➕ Apply Leave</button></Link>
        </div>
      </div>

      {balance.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏖️</div>
          <p style={{ fontSize: 18, fontWeight: "600", color: "#1e3a8a" }}>No leave balance found.</p>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>Ask your admin to initialize your leave balance.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {balance.map((b, i) => {
            const pct  = Math.round((b.available_days / b.total_days) * 100);
            const used = b.total_days - b.available_days;
            return (
              <div key={b.leave_name} style={{ ...styles.card, borderTop: `4px solid ${colors[i % colors.length]}` }}>
                <div style={styles.cardHeader}>
                  <div style={styles.leaveName}>{b.leave_name}</div>
                  <div style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: "700", backgroundColor: colors[i % colors.length] + "20", color: colors[i % colors.length] }}>{pct}% left</div>
                </div>
                <div style={styles.daysRow}>
                  <div style={styles.daysBlock}>
                    <div style={{ fontSize: 28, fontWeight: "700", color: colors[i % colors.length] }}>{b.available_days}</div>
                    <div style={styles.daysLabel}>Available</div>
                  </div>
                  <div style={styles.divider} />
                  <div style={styles.daysBlock}>
                    <div style={{ fontSize: 28, fontWeight: "700", color: "#1e293b" }}>{b.total_days}</div>
                    <div style={styles.daysLabel}>Total</div>
                  </div>
                  <div style={styles.divider} />
                  <div style={styles.daysBlock}>
                    <div style={{ fontSize: 28, fontWeight: "700", color: "#dc2626" }}>{used}</div>
                    <div style={styles.daysLabel}>Used</div>
                  </div>
                </div>
                <div style={styles.progressBg}>
                  <div style={{ height: "100%", borderRadius: 4, backgroundColor: colors[i % colors.length], width: `${pct}%`, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 32, backgroundColor: "#eff6ff", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  headerBtns: { display: "flex", gap: 10 },
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  applyBtn: { padding: "8px 18px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(29,78,216,0.08)", border: "1px solid #dbeafe" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  leaveName: { fontSize: 16, fontWeight: "700", color: "#1e3a8a" },
  daysRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  daysBlock: { textAlign: "center", flex: 1 },
  daysLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: "500" },
  divider: { width: 1, height: 40, backgroundColor: "#e2e8f0" },
  progressBg: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  empty: { backgroundColor: "#fff", borderRadius: 12, padding: 60, textAlign: "center", border: "1px solid #dbeafe" },
};

export default LeaveBalance;