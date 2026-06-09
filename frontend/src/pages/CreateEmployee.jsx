import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function CreateEmployee() {
  const [departments, setDepartments]     = useState([]);
  const [skills, setSkills]               = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", department_id: "", phone: "", address: "", designation: "", salary: "" });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: token };
        const [deptRes, skillRes] = await Promise.all([
          axios.get("http://localhost:5000/api/departments", { headers }),
          axios.get("http://localhost:5000/api/skills", { headers }),
        ]);
        setDepartments(deptRes.data);
        setSkills(skillRes.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    fetchData();
  }, [token, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleSkill = (id) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const signupRes = await axios.post("http://localhost:5000/api/auth/signup", {
        name: form.name, email: form.email, password: form.password,
      });
      const newUserId = signupRes.data.user.id;
      await axios.post("http://localhost:5000/api/employees",
        { user_id: newUserId, department_id: form.department_id, phone: form.phone, address: form.address, designation: form.designation, salary: form.salary, skills: selectedSkills },
        { headers: { Authorization: token } }
      );
      alert("Employee created successfully!");
      navigate("/employees");
    } catch (error) {
      handleApiError(error, navigate);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>➕ Create Employee</h1>
            <p style={styles.pageSub}>Add a new employee to the system</p>
          </div>
          <Link to="/employees"><button style={styles.backBtn}>← Back</button></Link>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.sectionTitle}>👤 Account Information</div>
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} name="name" placeholder="John Smith" onChange={handleChange} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} name="email" type="email" placeholder="john@company.com" onChange={handleChange} required />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} name="password" type="password" placeholder="Set login password" onChange={handleChange} required />
          </div>

          <div style={styles.sectionTitle}>💼 Job Information</div>
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Department</label>
              <select style={styles.input} name="department_id" onChange={handleChange} required>
                <option value="">-- Select Department --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Designation</label>
              <input style={styles.input} name="designation" placeholder="e.g. Software Engineer" onChange={handleChange} required />
            </div>
          </div>
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Salary (₹)</label>
              <input style={styles.input} name="salary" type="number" placeholder="50000" onChange={handleChange} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Phone</label>
              <input style={styles.input} name="phone" placeholder="9876543210" onChange={handleChange} required />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Address</label>
            <textarea style={{ ...styles.input, height: 70, resize: "vertical" }} name="address" placeholder="Full Address" onChange={handleChange} required />
          </div>

          <div style={styles.sectionTitle}>🛠️ Skills <span style={styles.hint}>(click to select)</span></div>
          <div style={styles.skillsGrid}>
            {skills.map(s => (
              <div key={s.id}
                style={{ ...styles.skillChip, backgroundColor: selectedSkills.includes(s.id) ? "#1d4ed8" : "#eff6ff", color: selectedSkills.includes(s.id) ? "#fff" : "#1e40af", border: `1.5px solid ${selectedSkills.includes(s.id) ? "#1d4ed8" : "#bfdbfe"}` }}
                onClick={() => toggleSkill(s.id)}>
                {selectedSkills.includes(s.id) ? "✓ " : ""}{s.skill_name}
              </div>
            ))}
          </div>
          {selectedSkills.length > 0 && <p style={styles.selectedCount}>✅ {selectedSkills.length} skill(s) selected</p>}

          <button style={styles.button} type="submit">Create Employee</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 32, backgroundColor: "#eff6ff", minHeight: "100vh" },
  card: { maxWidth: 700, margin: "0 auto", backgroundColor: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(29,78,216,0.08)", border: "1px solid #dbeafe" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1d4ed8", borderBottom: "2px solid #dbeafe", paddingBottom: 6, marginTop: 8 },
  hint: { fontWeight: "400", color: "#94a3b8", fontSize: 12 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: { padding: "10px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", backgroundColor: "#f8fafc", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  skillsGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  skillChip: { padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "600", userSelect: "none" },
  selectedCount: { fontSize: 13, color: "#059669", margin: 0 },
  button: { padding: 13, backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "700", cursor: "pointer", marginTop: 8 },
};

export default CreateEmployee;