import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function ResetPassword() {
  const [form, setForm]       = useState({ token: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", form);
      setMessage(res.data.message);
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🔒</div>
          <div style={styles.logoText}>Reset Password</div>
          <div style={styles.logoSub}>Enter your reset token and new password</div>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Reset Token</label>
            <input style={styles.input} name="token" placeholder="Paste your reset token here" onChange={handleChange} required />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>New Password</label>
            <input style={styles.input} name="newPassword" type="password" placeholder="Enter new password" onChange={handleChange} required />
          </div>
          <button style={styles.button} type="submit">Reset Password</button>
        </form>
        {message && (
          <p style={{ color: message.includes("successful") ? "#059669" : "#dc2626", marginTop: 12, fontWeight: "600", fontSize: 14 }}>
            {message.includes("successful") ? "✅" : "❌"} {message}
          </p>
        )}
        <div style={styles.links}>
          <Link to="/forgot-password" style={styles.link}>← Back to Forgot Password</Link>
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
  logoText: { fontSize: 20, fontWeight: "700", color: "#1e40af" },
  logoSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: { padding: "11px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", backgroundColor: "#f8fafc" },
  button: { padding: "12px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "600", cursor: "pointer" },
  links: { textAlign: "center", marginTop: 20, fontSize: 13 },
  link: { color: "#1d4ed8", textDecoration: "none", fontWeight: "500" },
};

export default ResetPassword;