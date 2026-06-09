import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/signup", form);
      alert("Account created! Please login.");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🏢</div>
          <div style={styles.logoText}>i-SOFTZONE</div>
          <div style={styles.logoSub}>Enterprise Management System</div>
        </div>
        <h2 style={styles.heading}>Create Account</h2>
        <p style={styles.sub}>Fill in your details to get started</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} name="name" placeholder="Your full name" onChange={handleChange} required />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} name="email" type="email" placeholder="you@company.com" onChange={handleChange} required />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} name="password" type="password" placeholder="Create a password" onChange={handleChange} required />
          </div>
          <button style={styles.button} type="submit">Create Account →</button>
        </form>
        <div style={styles.links}>
          <span style={{ color: "#64748b", fontSize: 13 }}>Already have an account?</span>
          <Link to="/" style={styles.link}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(29,78,216,0.10)", border: "1px solid #dbeafe" },
  logoArea: { textAlign: "center", marginBottom: 28 },
  logoIcon: { fontSize: 36, marginBottom: 6 },
  logoText: { fontSize: 20, fontWeight: "700", color: "#1e40af", letterSpacing: 1 },
  logoSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  heading: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: "0 0 4px" },
  sub: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: { padding: "11px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", backgroundColor: "#f8fafc" },
  button: { padding: "12px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "600", cursor: "pointer", marginTop: 4 },
  links: { display: "flex", justifyContent: "center", gap: 8, marginTop: 20, fontSize: 13 },
  link: { color: "#1d4ed8", textDecoration: "none", fontWeight: "600" },
};

export default Signup;