import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function Profile() {
  const [user, setUser]           = useState(null);
  const [name, setName]           = useState("");
  const [uploading, setUploading] = useState(false);
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/user/profile", {
        headers: { Authorization: token },
      });
      setUser(res.data.user);
      setName(res.data.user.name);
      localStorage.setItem("name", res.data.user.name);
      if (res.data.user.avatar) {
        localStorage.setItem("avatar", res.data.user.avatar);
      }
    } catch (err) { handleApiError(err, navigate); }
  }, [token, navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show instant local preview
    const previewUrl = URL.createObjectURL(file);
    setUser(prev => ({ ...prev, _preview: previewUrl }));

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post(
        "http://localhost:5000/api/user/avatar",
        formData,
        { headers: { Authorization: token, "Content-Type": "multipart/form-data" } }
      );
      localStorage.setItem("avatar", res.data.avatar);
      await fetchProfile();
      alert("✅ Profile picture updated!");
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
      setUser(prev => ({ ...prev, _preview: null }));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://localhost:5000/api/user/profile",
        { name },
        { headers: { Authorization: token } }
      );
      localStorage.setItem("name", name);
      alert("✅ Name updated successfully!");
      fetchProfile();
    } catch (err) { handleApiError(err, navigate); }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const roleBadge = {
    admin:    { label: "Administrator", bg: "#fee2e2", color: "#dc2626" },
    manager:  { label: "Manager",       bg: "#fef3c7", color: "#d97706" },
    hr:       { label: "HR",            bg: "#dbeafe", color: "#1d4ed8" },
    employee: { label: "Employee",      bg: "#dcfce7", color: "#059669" },
  };
  const rb = roleBadge[user?.role] || roleBadge.employee;

  if (!user) return (
    <div style={styles.loadingPage}>
      <div style={styles.spinner}></div>
      <p style={{ color: "#1d4ed8", marginTop: 12 }}>Loading profile...</p>
    </div>
  );

  // Determine what to show as avatar
  const avatarSrc = user._preview
    ? user._preview
    : user.avatar
    ? `http://localhost:5000${user.avatar}?t=${new Date().getTime()}`
    : null;

  return (
    <div style={styles.wrapper}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>👤 My Profile</h1>
          <p style={styles.pageSub}>Manage your account information</p>
        </div>
        <Link to="/dashboard">
          <button style={styles.backBtn}>← Dashboard</button>
        </Link>
      </div>

      <div style={styles.grid}>

        {/* ── Left — Avatar Card ── */}
        <div style={styles.avatarCard}>

          {/* Avatar */}
          <div style={styles.avatarWrapper}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.name}
                style={styles.avatarImg}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div style={{
              ...styles.avatarInitials,
              display: avatarSrc ? "none" : "flex",
            }}>
              {getInitials(user.name)}
            </div>

            {/* Camera overlay */}
            <label
              style={{ ...styles.avatarOverlay, backgroundColor: uploading ? "#d97706" : "#1d4ed8" }}
              htmlFor="avatarInput"
              title="Change profile picture"
            >
              {uploading ? "⏳" : "📷"}
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Name & Email */}
          <div style={styles.avatarName}>{user.name}</div>
          <div style={styles.avatarEmail}>{user.email}</div>
          <span style={{ ...styles.rolePill, backgroundColor: rb.bg, color: rb.color }}>
            {rb.label}
          </span>

          <p style={styles.uploadHint}>
            {uploading ? "Uploading..." : "Click 📷 to change photo"}
          </p>

          {/* Info Rows */}
          <div style={styles.infoSection}>
            {[
              { label: "User ID", value: `#${user.id}` },
              { label: "Email",   value: user.email    },
              { label: "Role",    value: user.role?.toUpperCase() },
            ].map(row => (
              <div key={row.label} style={styles.infoRow}>
                <span style={styles.infoLabel}>{row.label}</span>
                <span style={styles.infoValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — Edit Card ── */}
        <div style={styles.editCard}>
          <h2 style={styles.editTitle}>Edit Profile</h2>
          <p style={styles.editSub}>Update your personal information</p>

          <form onSubmit={handleUpdateName} style={styles.form}>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                style={{ ...styles.input, backgroundColor: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }}
                value={user.email}
                disabled
              />
              <span style={styles.fieldNote}>Email cannot be changed</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Role</label>
              <input
                style={{ ...styles.input, backgroundColor: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }}
                value={user.role?.toUpperCase()}
                disabled
              />
              <span style={styles.fieldNote}>Role is managed by admin</span>
            </div>

            <button style={styles.saveBtn} type="submit">
              💾 Save Changes
            </button>
          </form>

          {/* Security Section */}
          <div style={styles.securitySection}>
            <h3 style={styles.securityTitle}>🔐 Security</h3>
            <Link to="/forgot-password" style={{ textDecoration: "none" }}>
              <div style={styles.securityCard}>
                <div>
                  <div style={styles.securityCardTitle}>Change Password</div>
                  <div style={styles.securityCardSub}>Update your login password</div>
                </div>
                <span style={{ color: "#1d4ed8", fontSize: 18 }}>→</span>
              </div>
            </Link>
          </div>

          {/* Upload Guide */}
          <div style={styles.uploadGuide}>
            <h3 style={styles.securityTitle}>🖼️ Profile Photo Guide</h3>
            <div style={styles.guideGrid}>
              {[
                { icon: "✅", text: "JPG, PNG, WEBP formats" },
                { icon: "✅", text: "Max size 2MB"           },
                { icon: "✅", text: "Square image recommended"},
                { icon: "✅", text: "Clear face photo"        },
              ].map(g => (
                <div key={g.text} style={styles.guideItem}>
                  <span>{g.icon}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingPage: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#eff6ff" },
  spinner: { width: 40, height: 40, border: "4px solid #bfdbfe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 32, backgroundColor: "#eff6ff", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  grid: { display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "start" },

  // Avatar Card
  avatarCard: { backgroundColor: "#fff", borderRadius: 16, padding: 32, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.08)", textAlign: "center" },
  avatarWrapper: { position: "relative", width: 120, height: 120, margin: "0 auto 16px" },
  avatarImg: { width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "4px solid #1d4ed8", display: "block" },
  avatarInitials: { width: 120, height: 120, borderRadius: "50%", backgroundColor: "#1d4ed8", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: "700", color: "#fff", border: "4px solid #bfdbfe" },
  avatarOverlay: { position: "absolute", bottom: 4, right: 4, width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", border: "3px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "all 0.2s" },
  avatarName: { fontSize: 20, fontWeight: "700", color: "#1e3a8a", marginBottom: 4 },
  avatarEmail: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  rolePill: { display: "inline-block", padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: "600" },
  uploadHint: { fontSize: 11, color: "#94a3b8", marginTop: 10, marginBottom: 20 },
  infoSection: { borderTop: "1px solid #dbeafe", paddingTop: 16, textAlign: "left" },
  infoRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  infoLabel: { fontSize: 13, color: "#64748b" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#1e3a8a" },

  // Edit Card
  editCard: { backgroundColor: "#fff", borderRadius: 16, padding: 32, border: "1px solid #dbeafe", boxShadow: "0 2px 8px rgba(29,78,216,0.08)" },
  editTitle: { fontSize: 18, fontWeight: "700", color: "#1e3a8a", margin: "0 0 4px" },
  editSub: { fontSize: 13, color: "#64748b", marginBottom: 28 },
  form: { display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: { padding: "11px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #bfdbfe", backgroundColor: "#f8fafc", fontFamily: "inherit" },
  fieldNote: { fontSize: 11, color: "#94a3b8" },
  saveBtn: { padding: 13, backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: "700", cursor: "pointer" },

  // Security
  securitySection: { borderTop: "1px solid #dbeafe", paddingTop: 20, marginBottom: 20 },
  securityTitle: { fontSize: 15, fontWeight: "700", color: "#1e3a8a", marginBottom: 12 },
  securityCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", backgroundColor: "#eff6ff", borderRadius: 8, border: "1px solid #dbeafe", cursor: "pointer" },
  securityCardTitle: { fontSize: 14, fontWeight: "600", color: "#1e3a8a" },
  securityCardSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  // Upload Guide
  uploadGuide: { borderTop: "1px solid #dbeafe", paddingTop: 20 },
  guideGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  guideItem: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: 6, border: "1px solid #dbeafe" },
};

export default Profile;