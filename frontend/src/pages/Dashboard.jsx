import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function Dashboard() {
  const [user, setUser]   = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const token  = localStorage.getItem("token");
  const role   = localStorage.getItem("role");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: token };
        const [profileRes, statsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/user/profile", { headers }),
          axios.get("http://localhost:5000/api/stats", { headers }),
        ]);
        setUser(profileRes.data.user);
        setStats(statsRes.data);
      } catch (err) { handleApiError(err, navigate); }
    };
    fetchData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const roleBadge = {
    admin:    { label: "Administrator", bg: "#fee2e2", color: "#dc2626" },
    manager:  { label: "Manager",       bg: "#fef3c7", color: "#d97706" },
    hr:       { label: "HR",            bg: "#dbeafe", color: "#1d4ed8" },
    employee: { label: "Employee",      bg: "#dcfce7", color: "#059669" },
  };
  const rb = roleBadge[role] || roleBadge.employee;

  if (!user || !stats) return (
    <div style={styles.loadingPage}>
      <div style={styles.loadingSpinner}></div>
      <p style={{ color: "#1d4ed8", marginTop: 12 }}>Loading...</p>
    </div>
  );

  const actions = [
    { to: "/apply-leave",   label: "Apply Leave",   icon: "📝", bg: "#1d4ed8", show: true },
    { to: "/my-leaves",     label: "My Leaves",     icon: "📋", bg: "#0891b2", show: true },
    { to: "/leave-balance", label: "Leave Balance", icon: "🏖️", bg: "#7c3aed", show: true },
    { to: "/notifications", label: "Notifications", icon: "🔔", bg: "#059669", show: true },
    { to: "/assets",        label: "Assets",        icon: "💻", bg: "#92400e", show: true },
    { to: "/leave-approval",label: "Approve Leaves",icon: "✅", bg: "#dc2626", show: ["manager","hr","admin"].includes(role) },
    { to: "/employees",     label: "Employees",     icon: "👥", bg: "#1e40af", show: ["hr","admin"].includes(role) },
    { to: "/employees/create",label:"Add Employee", icon: "➕", bg: "#065f46", show: ["hr","admin"].includes(role) },
    { to: "/reports",       label: "Reports",       icon: "📊", bg: "#1d4ed8", show: ["hr","admin"].includes(role) },
    { to: "/departments",   label: "Departments",   icon: "🏬", bg: "#0e7490", show: role === "admin" },
    { to: "/skills",        label: "Skills",        icon: "🛠️", bg: "#4338ca", show: role === "admin" },
    { to: "/manage-roles",  label: "Manage Roles",  icon: "🔐", bg: "#be185d", show: role === "admin" },
    { to: "/attendance",    label: "Mark Attendance", icon: "📅", bg: "#059669", show: ["admin","hr","manager"].includes(role) },
    { to: "/my-attendance", label: "My Attendance",   icon: "🗓️", bg: "#0891b2", show: true },
  ].filter(a => a.show);

  return (
    <div style={styles.wrapper}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={styles.navLogo}>🏢</span>
          <span style={styles.navTitle}>i-SOFTZONE Technologies</span>
        </div>
        <div style={styles.navLinks}>
          <Link to="/my-leaves"     style={styles.navLink}>My Leaves</Link>
          <Link to="/leave-balance" style={styles.navLink}>Leave Balance</Link>
          <Link to="/apply-leave"   style={styles.navLink}>Apply Leave</Link>
          <Link to="/notifications" style={styles.navLink}>🔔</Link>
          <Link to="/my-attendance" style={styles.navLink}>🗓️ My Attendance</Link>
          {["manager","hr","admin"].includes(role) && <Link to="/attendance" style={styles.navLink}>📅 Attendance</Link>}
          {["manager","hr","admin"].includes(role) && <Link to="/leave-approval" style={styles.navLink}>Approve Leaves</Link>}
          {["hr","admin"].includes(role)           && <Link to="/employees"      style={styles.navLink}>Employees</Link>}
          {["hr","admin"].includes(role)           && <Link to="/reports"        style={styles.navLink}>Reports</Link>}
          {role === "admin"                        && <Link to="/departments"    style={styles.navLink}>Departments</Link>}
          {role === "admin"                        && <Link to="/skills"         style={styles.navLink}>Skills</Link>}
          {role === "admin"                        && <Link to="/manage-roles"   style={styles.navLink}>Roles</Link>}

          {/* Profile */}
          <Link to="/profile" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
            {localStorage.getItem("avatar") ? (
              <img src={`http://localhost:5000${localStorage.getItem("avatar")}`} alt="avatar"
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "2px solid #bfdbfe" }} />
            ) : (
              <div style={styles.navAvatarInitials}>
                {(localStorage.getItem("name") || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
              {localStorage.getItem("name")}
            </span>
          </Link>

          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.page}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Welcome back, {user.name}! 👋</h1>
            <p style={styles.pageSub}>Here's what's happening in your organization today.</p>
          </div>
          <span style={{ ...styles.rolePill, backgroundColor: rb.bg, color: rb.color }}>
            {rb.label}
          </span>
        </div>

        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          {[
            { label: "Total Employees",  value: stats.totalEmployees,   icon: "👥", bg: "#1d4ed8" },
            { label: "Departments",      value: stats.totalDepartments, icon: "🏬", bg: "#0891b2" },
            { label: "Skills",           value: stats.totalSkills,      icon: "🛠️", bg: "#d97706" },
            { label: "Images",           value: stats.totalImages,      icon: "🖼️", bg: "#7c3aed" },
          ].map((s) => (
            <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.bg}` }}>
              <div style={{ ...styles.statIcon, backgroundColor: s.bg + "20" }}>{s.icon}</div>
              <div style={styles.statNum}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <p style={styles.sectionSub}>Frequently used features</p>
          </div>
          <div style={styles.actionsGrid}>
            {actions.map((a) => (
              <Link key={a.to} to={a.to} style={{ textDecoration: "none" }}>
                <div style={styles.actionCard}>
                  <div style={{ ...styles.actionIcon, backgroundColor: a.bg }}>{a.icon}</div>
                  <div style={styles.actionLabel}>{a.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingPage: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#eff6ff" },
  loadingSpinner: { width: 40, height: 40, border: "4px solid #bfdbfe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  wrapper: { minHeight: "100vh", backgroundColor: "#eff6ff", fontFamily: "'Inter','Segoe UI',sans-serif" },
  navbar: { backgroundColor: "#1d4ed8", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(29,78,216,0.3)", position: "sticky", top: 0, zIndex: 100 },
  navLeft: { display: "flex", alignItems: "center", gap: 10 },
  navLogo: { fontSize: 22 },
  navTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  navLinks: { display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" },
  navLink: { color: "#bfdbfe", textDecoration: "none", fontSize: 13, padding: "6px 10px", borderRadius: 6, fontWeight: "500" },
  navAvatarInitials: { width: 32, height: 32, borderRadius: "50%", backgroundColor: "#bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "700", color: "#1e3a8a", border: "2px solid #fff" },
  logoutBtn: { backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "600", marginLeft: 8 },
  page: { padding: "28px 32px", maxWidth: 1280, margin: "0 auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 14, color: "#64748b", marginTop: 4 },
  rolePill: { padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: "600" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 },
  statCard: { backgroundColor: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 8px rgba(29,78,216,0.06)", border: "1px solid #dbeafe" },
  statIcon: { width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 },
  statNum: { fontSize: 32, fontWeight: "700", color: "#1e3a8a" },
  statLabel: { fontSize: 13, color: "#64748b", marginTop: 2 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(29,78,216,0.06)", border: "1px solid #dbeafe" },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  sectionSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  actionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 },
  actionCard: { backgroundColor: "#f8fafc", border: "1px solid #dbeafe", borderRadius: 10, padding: "16px 12px", textAlign: "center", cursor: "pointer" },
  actionIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 10px" },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#1e3a8a" },
};

export default Dashboard;