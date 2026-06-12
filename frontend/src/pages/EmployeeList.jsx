import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import { setCache, getCache } from "../utils/cache";
import Layout from "../components/Layout";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      const cached = getCache("employees");
      if (cached) { setEmployees(cached); setLoading(false); return; }
      try {
        const res = await axios.get("http://localhost:5000/api/employees", {
          headers: { Authorization: token },
        });
        setCache("employees", res.data, 30);
        setEmployees(res.data);
      } catch (err) {
        handleApiError(err, navigate);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [token, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`, {
        headers: { Authorization: token },
      });
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err) { handleApiError(err, navigate); }
  };

  const rolePill = (role) => {
    const map = {
      admin:    { bg: "#fef3f2", color: "#b42318", border: "#fecdca" },
      manager:  { bg: "#fffaeb", color: "#b54708", border: "#fedf89" },
      hr:       { bg: "#f0f9ff", color: "#026aa2", border: "#b9e6fe" },
      employee: { bg: "#f0fdf9", color: "#107569", border: "#99f6e0" },
    };
    const st = map[role] || map.employee;
    return (
      <span style={{ fontSize: 11, fontWeight: "600", padding: "2px 8px", borderRadius: 12, backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
        {role}
      </span>
    );
  };

  const deptStyle = (dept) => {
    const colors = ["#eff8ff","#f0fdf4","#fffaeb","#fdf4ff","#fff1f0","#f0fdfa"];
    const texts  = ["#1d4ed8","#15803d","#b45309","#7e22ce","#b91c1c","#0f766e"];
    const borders= ["#bfdbfe","#bbf7d0","#fde68a","#e9d5ff","#fecaca","#99f6e0"];
    if (!dept) return { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" };
    const i = dept.charCodeAt(0) % colors.length;
    return { bg: colors[i], text: texts[i], border: borders[i] };
  };

  const avatarColors = ["#4f8ef7","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4"];
  const avatarBg  = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];
  const initials  = (name = "") => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const filtered  = employees.filter(e =>
    [e.name, e.email, e.designation, e.department_name]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>👥 All employees — {filtered.length} total</h1>
          <div style={s.headerRight}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.search}
                placeholder="Search employees..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Link to="/employees/create">
              <button style={s.addBtn}>+ Add Employee</button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div style={s.card}>
          {loading ? (
            <div style={s.loading}>
              <div style={s.spinner} />
              <span style={{ marginLeft: 12, color: "#64748b", fontSize: 14 }}>Loading...</span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["EMPLOYEE","DESIGNATION","DEPARTMENT","PHONE","SALARY","ROLE","ACTIONS"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={s.empty}>No employees found</td></tr>
                  ) : filtered.map(emp => {
                    const dc = deptStyle(emp.department_name);
                    return (
                      <tr key={emp.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.empCell}>
                            <div style={{ ...s.empAvatar, backgroundColor: avatarBg(emp.name) }}>
                              {initials(emp.name)}
                            </div>
                            <div>
                              <div style={s.empName}>{emp.name}</div>
                              <div style={s.empEmail}>{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={s.td}>{emp.designation || "—"}</td>
                        <td style={s.td}>
                          {emp.department_name
                            ? <span style={{ fontSize: 12, fontWeight: "600", padding: "3px 10px", borderRadius: 6, backgroundColor: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>{emp.department_name}</span>
                            : "—"}
                        </td>
                        <td style={s.td}>{emp.phone || "—"}</td>
                        <td style={{ ...s.td, fontWeight: "600" }}>
                          {emp.salary ? `₹${Number(emp.salary).toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td style={s.td}>{rolePill(emp.role || "employee")}</td>
                        <td style={s.td}>
                          <Link to={`/employees/edit/${emp.id}`}>
                            <button style={s.editBtn}>Edit</button>
                          </Link>
                          <button style={s.deleteBtn} onClick={() => handleDelete(emp.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

const s = {
  page:       { padding: "28px 32px", maxWidth: 1200, margin: "0 auto" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  title:      { fontSize: 20, fontWeight: "700", color: "#111827", margin: 0 },
  headerRight:{ display: "flex", gap: 10, alignItems: "center" },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 10, fontSize: 12, pointerEvents: "none" },
  search:     { padding: "8px 12px 8px 30px", fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", outline: "none", width: 220, fontFamily: "inherit", color: "#374151" },
  addBtn:     { padding: "9px 16px", backgroundColor: "#1a1f2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "600", fontFamily: "inherit" },
  card:       { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e9eef5", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { padding: "11px 16px", fontSize: 11, fontWeight: "600", color: "#6b7280", letterSpacing: "0.05em", textAlign: "left", backgroundColor: "transparent", minHeight: "auto", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
  tr:         { borderBottom: "1px solid #f7f7f8" },
  td:         { padding: "13px 16px", verticalAlign: "middle", fontSize: 13, color: "#374151" },
  empCell:    { display: "flex", alignItems: "center", gap: 11 },
  empAvatar:  { width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "700", color: "#fff", flexShrink: 0 },
  empName:    { fontSize: 13.5, fontWeight: "600", color: "#111827" },
  empEmail:   { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  editBtn:    { padding: "5px 14px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "600", marginRight: 8, fontFamily: "inherit" },
  deleteBtn:  { padding: "5px 14px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "600", fontFamily: "inherit" },
  empty:      { padding: "56px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 },
  loading:    { display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" },
  spinner:    { width: 24, height: 24, borderRadius: "50%", border: "3px solid #e2e8f0", borderTop: "3px solid #4f8ef7", animation: "spin 0.7s linear infinite" },
};