import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName]               = useState("");
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/departments", { headers: { Authorization: token } });
      setDepartments(res.data);
    } catch (err) { handleApiError(err, navigate); }
  };

  useEffect(() => { fetchDepartments(); }, [token, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/departments", { department_name: name }, { headers: { Authorization: token } });
      setName("");
      fetchDepartments();
    } catch (err) { handleApiError(err, navigate); }
  };

  const icons = ["💻","🧪","👥","💰","📣","📞","⚙️","🛠️","📦","🎯"];

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>🏬 Departments</h1>
          <p style={styles.pageSub}>{departments.length} departments</p>
        </div>
        <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
      </div>
      <div style={styles.formCard}>
        <h3 style={styles.formTitle}>Add New Department</h3>
        <form onSubmit={handleAdd} style={styles.addForm}>
          <input style={styles.input} placeholder="e.g. Product Management" value={name} onChange={(e) => setName(e.target.value)} required />
          <button style={styles.addBtn} type="submit">➕ Add</button>
        </form>
      </div>
      <div style={styles.grid}>
        {departments.map((d, i) => (
          <div key={d.id} style={styles.card}>
            <div style={styles.cardIcon}>{icons[i % icons.length]}</div>
            <div style={styles.cardName}>{d.department_name}</div>
            <div style={styles.cardId}>Dept #{d.id}</div>
          </div>
        ))}
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
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 24, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.06)" },
  formTitle: { fontSize: 15, fontWeight: "700", color: "#1e3a8a", marginBottom: 14 },
  addForm: { display: "flex", gap: 12 },
  input: { padding: "10px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", flex: 1, backgroundColor: "#f8fafc", fontFamily: "inherit" },
  addBtn: { padding: "10px 20px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: "24px 20px", textAlign: "center", border: "1px solid #dbeafe", boxShadow: "0 2px 6px rgba(29,78,216,0.06)", borderTop: "4px solid #1d4ed8" },
  cardIcon: { fontSize: 32, marginBottom: 12 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1e3a8a" },
  cardId: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
};

export default Departments;