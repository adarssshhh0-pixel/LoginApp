import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import Layout from "../components/Layout";

const ACTIONS = [
  { to: "/apply-leave",    label: "Apply Leave",     icon: "📝", bg: "#eff8ff", color: "#1d4ed8", roles: ["admin","hr","manager","employee"] },
  { to: "/my-leaves",      label: "My Leaves",       icon: "📋", bg: "#f0fdf4", color: "#15803d", roles: ["admin","hr","manager","employee"] },
  { to: "/leave-balance",  label: "Leave Balance",   icon: "🏖️", bg: "#fdf4ff", color: "#7e22ce", roles: ["admin","hr","manager","employee"] },
  { to: "/my-attendance",  label: "My Attendance",   icon: "🗓️", bg: "#fff7ed", color: "#c2410c", roles: ["admin","hr","manager","employee"] },
  { to: "/my-payroll",     label: "My Payslips",     icon: "🧾", bg: "#f0fdfa", color: "#0f766e", roles: ["admin","hr","manager","employee"] },
  { to: "/notifications",  label: "Notifications",   icon: "🔔", bg: "#fef2f2", color: "#b91c1c", roles: ["admin","hr","manager","employee"] },
  { to: "/assets",         label: "Assets",          icon: "💻", bg: "#fffbeb", color: "#b45309", roles: ["admin","hr","manager","employee"] },
  { to: "/leave-approval", label: "Approve Leaves",  icon: "✅", bg: "#ecfdf5", color: "#059669", roles: ["manager","hr","admin"] },
  { to: "/employees",      label: "Employees",       icon: "👥", bg: "#eff8ff", color: "#1d4ed8", roles: ["hr","admin"] },
  { to: "/employees/create",label: "Add Employee",   icon: "➕", bg: "#f0fdf4", color: "#15803d", roles: ["hr","admin"] },
  { to: "/payroll",        label: "Payroll",         icon: "💰", bg: "#fff7ed", color: "#b45309", roles: ["hr","admin"] },
  { to: "/reports",        label: "Reports",         icon: "📊", bg: "#fdf4ff", color: "#7e22ce", roles: ["hr","admin"] },
  { to: "/attendance",     label: "Mark Attendance", icon: "📅", bg: "#f0fdfa", color: "#0f766e", roles: ["admin","hr","manager"] },
  { to: "/departments",    label: "Departments",     icon: "🏬", bg: "#eff8ff", color: "#1d4ed8", roles: ["admin"] },
  { to: "/skills",         label: "Skills",          icon: "🛠️", bg: "#fdf4ff", color: "#7e22ce", roles: ["admin"] },
  { to: "/manage-roles",   label: "Manage Roles",    icon: "🔐", bg: "#fef2f2", color: "#b91c1c", roles: ["admin"] },
];

const ROLE_BADGE = {
  admin:    { label: "Administrator", bg: "#fef3f2", color: "#b42318" },
  manager:  { label: "Manager",       bg: "#fffaeb", color: "#b54708" },
  hr:       { label: "HR",            bg: "#eff8ff", color: "#026aa2" },
  employee: { label: "Employee",      bg: "#f0fdf9", color: "#107569" },
};

export default function Dashboard() {
  const [user, setUser]   = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role") || "employee";

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

  const rb = ROLE_BADGE[role] || ROLE_BADGE.employee;
  const visibleActions = ACTIONS.filter(a => a.roles.includes(role));

  const STAT_CARDS = stats ? [
    { label: "Total Employees", value: stats.totalEmployees,   icon: "👥", color: "#4f8ef7", bg: "#eff8ff" },
    { label: "Departments",     value: stats.totalDepartments, icon: "🏬", color: "#10b981", bg: "#f0fdf4" },
    { label: "Skills",          value: stats.totalSkills,      icon: "🛠️", color: "#f59e0b", bg: "#fffbeb" },
    { label: "Employee Images", value: stats.totalImages,      icon: "🖼️", color: "#8b5cf6", bg: "#fdf4ff" },
  ] : [];

  return (
    <Layout>
      <div style={s.page}>

        {/* Greeting */}
        <div style={s.greetRow}>
          <div>
            <h1 style={s.greetTitle}>
              Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p style={s.greetSub}>Here's what's happening in your organization today.</p>
          </div>
          <span style={{ ...s.rolePill, backgroundColor: rb.bg, color: rb.color }}>
            {rb.label}
          </span>
        </div>

        {/* Stat cards */}
        {STAT_CARDS.length > 0 && (
          <div style={s.statsGrid}>
            {STAT_CARDS.map(st => (
              <div key={st.label} style={{ ...s.statCard, borderTop: `3px solid ${st.color}` }}>
                <div style={{ ...s.statIconBox, backgroundColor: st.bg }}>
                  <span style={{ fontSize: 18 }}>{st.icon}</span>
                </div>
                <div style={s.statNum}>{st.value ?? "—"}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Quick Actions</h2>
          <p style={s.sectionSub}>Frequently used features</p>
          <div style={s.actionsGrid}>
            {visibleActions.map(a => (
              <Link key={a.to} to={a.to} style={{ textDecoration: "none" }}>
                <div style={s.actionCard}>
                  <div style={{ ...s.actionIcon, backgroundColor: a.bg }}>
                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                  </div>
                  <div style={{ ...s.actionLabel, color: a.color }}>{a.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

const s = {
  page:       { padding: "28px 32px", maxWidth: 1200, margin: "0 auto" },
  greetRow:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  greetTitle: { fontSize: 22, fontWeight: "700", color: "#111827", margin: 0 },
  greetSub:   { fontSize: 14, color: "#6b7280", marginTop: 4 },
  rolePill:   { padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: "600" },
  statsGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 },
  statCard:   { backgroundColor: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e9eef5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  statIconBox:{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  statNum:    { fontSize: 28, fontWeight: "800", color: "#111827" },
  statLabel:  { fontSize: 12, color: "#6b7280", marginTop: 2 },
  section:    { backgroundColor: "#fff", borderRadius: 12, padding: "22px 24px", border: "1px solid #e9eef5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  sectionTitle:{ fontSize: 16, fontWeight: "700", color: "#111827", margin: 0 },
  sectionSub: { fontSize: 13, color: "#6b7280", marginTop: 3, marginBottom: 18 },
  actionsGrid:{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 12 },
  actionCard: { backgroundColor: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 10, padding: "14px 10px", textAlign: "center", cursor: "pointer" },
  actionIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" },
  actionLabel:{ fontSize: 12, fontWeight: "600" },
};