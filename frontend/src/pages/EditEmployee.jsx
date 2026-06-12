import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import Layout from "../components/Layout";

function EditEmployee() {
  const { id } = useParams();
  const [departments, setDepartments]       = useState([]);
  const [skills, setSkills]                 = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [images, setImages]                 = useState([]);
  const [files, setFiles]                   = useState(null);
  const [form, setForm] = useState({ department_id: "", phone: "", address: "", designation: "", salary: "" });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: token };
        const [empRes, deptRes, skillRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/employees/${id}`, { headers }),
          axios.get("http://localhost:5000/api/departments", { headers }),
          axios.get("http://localhost:5000/api/skills", { headers }),
        ]);
        const emp = empRes.data;
        setForm({ department_id: emp.department_id, phone: emp.phone, address: emp.address, designation: emp.designation, salary: emp.salary });
        setSelectedSkills(emp.skills.map(s => s.id));
        setImages(emp.images || []);
        setDepartments(deptRes.data);
        setSkills(skillRes.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    fetchData();
  }, [id, token, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleSkill = (sid) => {
    setSelectedSkills(prev =>
      prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/employees/${id}`,
        { ...form, skills: selectedSkills },
        { headers: { Authorization: token } }
      );
      alert("Employee updated!");
      navigate("/employees");
    } catch (err) { handleApiError(err, navigate); }
  };

  const handleImageUpload = async () => {
    if (!files || files.length === 0) return alert("Select files first");
    const formData = new FormData();
    for (const file of files) formData.append("images", file);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/employees/upload/${id}`, formData,
        { headers: { Authorization: token, "Content-Type": "multipart/form-data" } }
      );
      alert(res.data.message);
      const empRes = await axios.get(`http://localhost:5000/api/employees/${id}`, { headers: { Authorization: token } });
      setImages(empRes.data.images || []);
    } catch (err) { alert("Upload failed"); }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>✏️ Edit Employee</h1>
            <p style={styles.pageSub}>Update employee information</p>
          </div>
          <Link to="/employees"><button style={styles.backBtn}>← Back</button></Link>
        </div>

        <form onSubmit={handleUpdate} style={styles.form}>
          <div style={styles.sectionTitle}>💼 Job Information</div>
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Department</label>
              <select style={styles.input} name="department_id" value={form.department_id} onChange={handleChange} required>
                <option value="">-- Select --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Designation</label>
              <input style={styles.input} name="designation" value={form.designation} onChange={handleChange} required />
            </div>
          </div>
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Salary (₹)</label>
              <input style={styles.input} name="salary" type="number" value={form.salary} onChange={handleChange} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Phone</label>
              <input style={styles.input} name="phone" value={form.phone} onChange={handleChange} required />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Address</label>
            <textarea style={{ ...styles.input, height: 70, resize: "vertical" }} name="address" value={form.address} onChange={handleChange} required />
          </div>
           <div style={styles.wrapper}>
    ...
  </div>
   <Layout>
    <div style={{ ...styles.wrapper, backgroundColor: "transparent", minHeight: "auto" }}>
      ...
    </div>
  </Layout>
          <div style={styles.sectionTitle}>🛠️ Skills</div>
          <div style={styles.skillsGrid}>
            {skills.map(s => (
              <div key={s.id}
                style={{ ...styles.skillChip, backgroundColor: selectedSkills.includes(s.id) ? "#1d4ed8" : "#eff6ff", color: selectedSkills.includes(s.id) ? "#fff" : "#1e40af", border: `1.5px solid ${selectedSkills.includes(s.id) ? "#1d4ed8" : "#bfdbfe"}` }}
                onClick={() => toggleSkill(s.id)}>
                {selectedSkills.includes(s.id) ? "✓ " : ""}{s.skill_name}
              </div>
            ))}
          </div>

          <button style={styles.button} type="submit">Update Employee</button>
        </form>

        {/* Image Upload */}
        <div style={styles.imageSection}>
          <div style={styles.sectionTitle}>🖼️ Employee Images</div>
          <p style={styles.imageHint}>Profile Photo, Aadhar Card, Resume, Certificate (max 5)</p>
          <div style={styles.uploadRow}>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
            <button style={styles.uploadBtn} onClick={handleImageUpload}>Upload</button>
          </div>
          {images.length > 0 && (
            <div style={styles.imageGrid}>
              {images.map(img => (
                <img key={img.id} src={`http://localhost:5000${img.image_url}`} alt="employee"
                  style={styles.image} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 32, backgroundColor: "transparent", minHeight: "auto" },
  card: { maxWidth: 700, margin: "0 auto", backgroundColor: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(29,78,216,0.08)", border: "1px solid #dbeafe" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1d4ed8", borderBottom: "2px solid #dbeafe", paddingBottom: 6, marginTop: 8 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: { padding: "10px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", backgroundColor: "#f8fafc", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  skillsGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  skillChip: { padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "600", userSelect: "none" },
  button: { padding: 13, backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "700", cursor: "pointer", marginTop: 8 },
  imageSection: { marginTop: 28, borderTop: "1px solid #dbeafe", paddingTop: 24 },
  imageHint: { fontSize: 12, color: "#94a3b8", marginBottom: 12 },
  uploadRow: { display: "flex", gap: 12, alignItems: "center", marginBottom: 16 },
  uploadBtn: { padding: "8px 16px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "600" },
  imageGrid: { display: "flex", flexWrap: "wrap", gap: 12 },
  image: { width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: "2px solid #dbeafe" },
};

export default EditEmployee;