import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [name, setName]     = useState("");
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchSkills = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/skills", { headers: { Authorization: token } });
      setSkills(res.data);
    } catch (err) { handleApiError(err, navigate); }
  };

  useEffect(() => { fetchSkills(); }, [token, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/skills", { skill_name: name }, { headers: { Authorization: token } });
      setName("");
      fetchSkills();
    } catch (err) { handleApiError(err, navigate); }
  };

  const colors = ["#1d4ed8","#059669","#d97706","#0891b2","#7c3aed","#dc2626","#065f46","#92400e","#1e40af","#be185d"];

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>🛠️ Skills</h1>
          <p style={styles.pageSub}>{skills.length} skills available</p>
        </div>
        <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
      </div>
      <div style={styles.formCard}>
        <h3 style={styles.formTitle}>Add New Skill</h3>
        <form onSubmit={handleAdd} style={styles.addForm}>
          <input style={styles.input} placeholder="e.g. TypeScript, Docker, AWS..." value={name} onChange={(e) => setName(e.target.value)} required />
          <button style={styles.addBtn} type="submit">➕ Add</button>
        </form>
      </div>
      <div style={styles.grid}>
        {skills.map((s, i) => (
          <div key={s.id} style={{ ...styles.chip, backgroundColor: colors[i % colors.length] + "18", border: `1.5px solid ${colors[i % colors.length]}40` }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colors[i % colors.length], flexShrink: 0 }}></span>
            <span style={{ fontSize: 14, fontWeight: "600", color: colors[i % colors.length] }}>{s.skill_name}</span>
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
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 20, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.06)" },
  formTitle: { fontSize: 15, fontWeight: "700", color: "#1e3a8a", marginBottom: 14 },
  addForm: { display: "flex", gap: 12 },
  input: { padding: "10px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", flex: 1, backgroundColor: "#f8fafc", fontFamily: "inherit" },
  addBtn: { padding: "10px 20px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap" },
  grid: { display: "flex", flexWrap: "wrap", gap: 12 },
  chip: { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 24 },
};

export default Skills;