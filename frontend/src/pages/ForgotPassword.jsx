import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [token, setToken]     = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setToken(res.data.resetToken);
      setMessage(res.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🔑</div>
          <div style={styles.logoText}>Forgot Password</div>
          <div style={styles.logoSub}>Enter your email to get a reset token</div>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button style={styles.button} type="submit">Get Reset Token</button>
        </form>
        {token && (
          <div style={styles.tokenBox}>
            <p style={{ color: "#059669", fontWeight: "700", marginBottom: 8 }}>✅ {message}</p>
            <p style={styles.tokenLabel}>Your Reset Token:</p>
            <p style={styles.token}>{token}</p>
            <p style={styles.expiry}>⏰ Expires in 15 minutes</p>
            <Link to="/reset-password">
              <button style={styles.linkButton}>Go to Reset Password →</button>
            </Link>
          </div>
        )}
        {message && !token && (
          <p style={{ color: "#dc2626", marginTop: 12, fontSize: 14 }}>❌ {message}</p>
        )}
        <div style={styles.links}>
          <Link to="/" style={styles.link}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 460, boxShadow: "0 4px 24px rgba(29,78,216,0.10)", border: "1px solid #dbeafe" },
  logoArea: { textAlign: "center", marginBottom: 28 },
  logoIcon: { fontSize: 36, marginBottom: 6 },
  logoText: { fontSize: 20, fontWeight: "700", color: "#1e40af" },
  logoSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: { padding: "11px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", backgroundColor: "#f8fafc" },
  button: { padding: "12px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "600", cursor: "pointer" },
  tokenBox: { marginTop: 20, backgroundColor: "#f0fdf4", padding: 16, borderRadius: 8, wordBreak: "break-all", border: "1px solid #bbf7d0" },
  tokenLabel: { fontWeight: "700", marginBottom: 4, fontSize: 13, color: "#1e3a8a" },
  token: { backgroundColor: "#dcfce7", padding: 8, borderRadius: 6, fontSize: 12, fontFamily: "monospace", color: "#065f46" },
  expiry: { color: "#dc2626", fontSize: 12, margin: "8px 0" },
  linkButton: { marginTop: 8, padding: "8px 16px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "600" },
  links: { textAlign: "center", marginTop: 20, fontSize: 13 },
  link: { color: "#1d4ed8", textDecoration: "none", fontWeight: "500" },
};

export default ForgotPassword;