import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function ApplyLeave() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balance, setBalance]       = useState([]);
  const [form, setForm] = useState({ leave_type_id: "", from_date: "", to_date: "", reason: "" });
  const [totalDays, setTotalDays]   = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: token };
        const [typesRes, balanceRes] = await Promise.all([
          axios.get("http://localhost:5000/api/leave/types", { headers }),
          axios.get("http://localhost:5000/api/leave/balance", { headers }),
        ]);
        setLeaveTypes(typesRes.data);
        setBalance(balanceRes.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    fetchData();
  }, [token, navigate]);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (updated.from_date && updated.to_date) {
      const days = Math.ceil((new Date(updated.to_date) - new Date(updated.from_date)) / 86400000) + 1;
      setTotalDays(days > 0 ? days : 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/leave/apply", form, { headers: { Authorization: token } });
      alert("Leave applied successfully!");
      navigate("/my-leaves");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to apply leave");
    }
  };

  const colors = ["#1d4ed8","#059669","#d97706","#0891b2"];

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>📝 Apply Leave</h1>
          <p style={styles.pageSub}>Submit a new leave request</p>
        </div>
        <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
      </div>

      {balance.length > 0 && (
        <div style={styles.balanceGrid}>
          {balance.map((b, i) => (
            <div key={b.leave_name} style={{ ...styles.balanceCard, borderTop: `3px solid ${colors[i % colors.length]}` }}>
              <div style={{ ...styles.balanceDays, color: colors[i % colors.length] }}>{b.available_days}</div>
              <div style={styles.balanceName}>{b.leave_name}</div>
              <div style={styles.balanceSub}>of {b.total_days} days</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.formCard}>
        <h2 style={styles.formTitle}>Leave Application Form</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Leave Type</label>
            <select style={styles.input} name="leave_type_id" onChange={handleChange} required>
              <option value="">-- Select Leave Type --</option>
              {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.leave_name}</option>)}
            </select>
          </div>
          <div style={styles.dateRow}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>From Date</label>
              <input style={styles.input} type="date" name="from_date" onChange={handleChange} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>To Date</label>
              <input style={styles.input} type="date" name="to_date" onChange={handleChange} required />
            </div>
          </div>
          {totalDays > 0 && (
            <div style={styles.daysInfo}>
              📅 Total <strong>{totalDays} day{totalDays > 1 ? "s" : ""}</strong> of leave requested
            </div>
          )}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Reason for Leave</label>
            <textarea style={{ ...styles.input, height: 100, resize: "vertical" }} name="reason" placeholder="Please describe your reason..." onChange={handleChange} required />
          </div>
          <button style={styles.button} type="submit">Submit Application</button>
        </form>
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
  balanceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 24 },
  balanceCard: { backgroundColor: "#fff", borderRadius: 10, padding: 16, textAlign: "center", border: "1px solid #dbeafe", boxShadow: "0 2px 6px rgba(29,78,216,0.06)" },
  balanceDays: { fontSize: 32, fontWeight: "700" },
  balanceName: { fontSize: 13, fontWeight: "600", color: "#1e3a8a", marginTop: 4 },
  balanceSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: 32, maxWidth: 640, boxShadow: "0 2px 8px rgba(29,78,216,0.08)", border: "1px solid #dbeafe" },
  formTitle: { fontSize: 18, fontWeight: "700", color: "#1e3a8a", marginBottom: 24 },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: { padding: "10px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", backgroundColor: "#f8fafc", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  dateRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  daysInfo: { backgroundColor: "#eff6ff", padding: "12px 16px", borderRadius: 8, fontSize: 14, color: "#1e40af", border: "1px solid #bfdbfe" },
  button: { padding: 14, backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "700", cursor: "pointer" },
};

export default ApplyLeave;