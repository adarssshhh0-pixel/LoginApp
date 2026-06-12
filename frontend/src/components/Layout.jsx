import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard",      label: "Dashboard",      icon: DashIcon,     roles: ["admin","hr","manager","employee"] },
  { to: "/employees",      label: "Employees",       icon: EmpIcon,      roles: ["admin","hr"] },
  { to: "/attendance",     label: "Attendance",      icon: AttIcon,      roles: ["admin","hr","manager"] },
  { to: "/my-attendance",  label: "My Attendance",   icon: MyAttIcon,    roles: ["employee"] },
  { to: "/leave-approval", label: "Leave Approval",  icon: LeaveApprIcon,roles: ["admin","hr","manager"] },
  { to: "/apply-leave",    label: "Apply Leave",     icon: ApplyIcon,    roles: ["admin","hr","manager","employee"] },
  { to: "/my-leaves",      label: "My Leaves",       icon: MyLeaveIcon,  roles: ["admin","hr","manager","employee"] },
  { to: "/leave-balance",  label: "Leave Balance",   icon: BalIcon,      roles: ["admin","hr","manager","employee"] },
  { to: "/payroll",        label: "Payroll",         icon: PayIcon,      roles: ["admin","hr"] },
  { to: "/my-payroll",     label: "My Payslips",     icon: SlipIcon,     roles: ["admin","hr","manager","employee"] },
  { to: "/assets",         label: "Assets",          icon: AssetIcon,    roles: ["admin","hr","manager","employee"] },
  { to: "/reports",        label: "Reports",         icon: ReptIcon,     roles: ["admin","hr"] },
  { to: "/departments",    label: "Departments",     icon: DeptIcon,     roles: ["admin"] },
  { to: "/skills",         label: "Skills",          icon: SkillIcon,    roles: ["admin"] },
  { to: "/manage-roles",   label: "Manage Roles",    icon: RoleIcon,     roles: ["admin"] },
  { to: "/notifications",  label: "Notifications",   icon: BellIcon,     roles: ["admin","hr","manager","employee"] },
];

const SECTIONS = [
  { label: "MAIN",      items: ["/dashboard"] },
  { label: "PEOPLE",    items: ["/employees","/attendance","/my-attendance"] },
  { label: "LEAVE",     items: ["/leave-approval","/apply-leave","/my-leaves","/leave-balance"] },
  { label: "FINANCE",   items: ["/payroll","/my-payroll"] },
  { label: "RESOURCES", items: ["/assets","/reports"] },
  { label: "ADMIN",     items: ["/departments","/skills","/manage-roles"] },
  { label: "GENERAL",   items: ["/notifications"] },
];

// ── Icons ──────────────────────────────────────────────
function DashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function EmpIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function AttIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function MyAttIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>;
}
function LeaveApprIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function ApplyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>;
}
function MyLeaveIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
}
function BalIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function PayIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
}
function SlipIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function AssetIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
}
function ReptIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function DeptIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
}
function SkillIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M20 12h2M2 12h2M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 2v2M12 20v2"/></svg>;
}
function RoleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function BellIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function LogoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ChevronIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}

// ── Main Layout Component ──────────────────────────────
export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const role   = localStorage.getItem("role") || "employee";
  const name   = localStorage.getItem("name") || "User";
  const avatar = localStorage.getItem("avatar");
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));
  const sidebarWidth = collapsed ? 64 : 220;

  return (
    <div style={s.shell}>

      {/* ── SIDEBAR ── */}
      <aside style={{ ...s.sidebar, width: sidebarWidth }}>

        {/* Logo / Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>iS</div>
          {!collapsed && (
            <div style={s.brandText}>
              <div style={s.brandName}>iSoftzone</div>
              <div style={s.brandSub}>HRMS Platform</div>
            </div>
          )}
          <button style={s.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            <span style={{
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              display: "inline-flex",
              transition: "transform 0.2s",
            }}>
              <ChevronIcon />
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav style={s.nav}>
          {SECTIONS.map(section => {
            const sectionItems = visibleItems.filter(item => section.items.includes(item.to));
            if (sectionItems.length === 0) return null;
            return (
              <div key={section.label} style={s.section}>
                {!collapsed && <div style={s.sectionLabel}>{section.label}</div>}
                {sectionItems.map(item => {
                  const active = location.pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} style={{ textDecoration: "none" }}>
                      <div
                        title={collapsed ? item.label : undefined}
                        style={{
                          ...s.navItem,
                          backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                          color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                          borderLeft: active ? "3px solid #4f8ef7" : "3px solid transparent",
                          paddingLeft: collapsed ? 20 : 16,
                          justifyContent: collapsed ? "center" : "flex-start",
                        }}
                      >
                        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                          <Icon />
                        </span>
                        {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile + Logout */}
        <div style={s.userArea}>
          <Link to="/profile" style={{ textDecoration: "none", flex: 1 }}>
            <div style={s.userCard}>
              {avatar ? (
                <img
                  src={`http://localhost:5000${avatar}`}
                  alt={name}
                  style={s.userAvatar}
                  onError={e => { e.target.style.display = "none"; }}
                />
              ) : (
                <div style={s.userAvatarInitials}>{initials}</div>
              )}
              {!collapsed && (
                <div style={s.userInfo}>
                  <div style={s.userName}>{name}</div>
                  <div style={s.userRole}>{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                </div>
              )}
            </div>
          </Link>
          <button style={s.logoutBtn} onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </button>
        </div>

      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ ...s.main, marginLeft: sidebarWidth }}>
        {children}
      </main>

    </div>
  );
}

// ── Styles ─────────────────────────────────────────────
const s = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f4f6fa",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  sidebar: {
    backgroundColor: "#1a1f2e",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0, left: 0,
    height: "100vh",
    zIndex: 100,
    transition: "width 0.25s ease",
    overflowX: "hidden",
    overflowY: "auto",
    scrollbarWidth: "none",
  },
  brand: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "20px 14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    flexShrink: 0, minHeight: 64,
  },
  brandIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "#4f8ef7",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: "800", color: "#fff",
    flexShrink: 0, letterSpacing: "-0.5px",
  },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { color: "#fff", fontWeight: "700", fontSize: 15, lineHeight: 1.2 },
  brandSub:  { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1 },
  collapseBtn: {
    background: "none", border: "none",
    color: "rgba(255,255,255,0.35)",
    cursor: "pointer", padding: 4,
    display: "flex", alignItems: "center",
    flexShrink: 0, borderRadius: 4,
  },
  nav: {
    flex: 1, padding: "8px 0",
    overflowY: "auto", scrollbarWidth: "none",
  },
  section: { marginBottom: 4 },
  sectionLabel: {
    fontSize: 10, fontWeight: "700",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.08em",
    padding: "10px 18px 4px",
  },
  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 16px",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    fontSize: 13.5, fontWeight: "500",
    borderRadius: "0 6px 6px 0",
    marginRight: 8,
    whiteSpace: "nowrap",
  },
  navLabel: { overflow: "hidden", textOverflow: "ellipsis" },
  userArea: {
    display: "flex", alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    padding: "12px 10px", gap: 6, flexShrink: 0,
  },
  userCard: {
    display: "flex", alignItems: "center", gap: 10,
    borderRadius: 8, padding: "6px 4px", cursor: "pointer",
  },
  userAvatar: {
    width: 34, height: 34, borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.15)",
    flexShrink: 0,
  },
  userAvatarInitials: {
    width: 34, height: 34, borderRadius: "50%",
    backgroundColor: "#4f8ef7",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: "700", color: "#fff",
    flexShrink: 0,
    border: "2px solid rgba(255,255,255,0.15)",
  },
  userInfo: { minWidth: 0 },
  userName: {
    color: "#fff", fontSize: 13, fontWeight: "600",
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap", maxWidth: 110,
  },
  userRole: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1 },
  logoutBtn: {
    background: "none", border: "none",
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer", padding: 7,
    borderRadius: 6, display: "flex",
    alignItems: "center", flexShrink: 0,
  },
  main: {
    flex: 1,
    minHeight: "100vh",
    backgroundColor: "#f4f6fa",
    transition: "margin-left 0.25s ease",
    padding: "24px",
    overflowY: "auto",
  },
};