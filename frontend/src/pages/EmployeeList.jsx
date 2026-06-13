import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import Layout from "../components/Layout";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [sortBy, setSortBy] = useState("id");
  const [order, setOrder] = useState("DESC");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
   
      try {
        const res = await axios.get(
  `http://localhost:5000/api/employees?page=${page}&limit=10&search=${search}&department=${department}&sortBy=${sortBy}&order=${order}` ,
  {
    headers: { Authorization: token },
  }
);
       console.log("API Response:", res.data);

const employeeData =
  Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.data?.employees)
    ? res.data.employees
    : Array.isArray(res.data?.data)
    ? res.data.data
    : [];


setEmployees(employeeData);
setTotalPages(res.data.totalPages || 1);
setTotalEmployees(res.data.total || 0);
      } catch (err) {
        handleApiError(err, navigate);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
}, [page, token, navigate, search, department, sortBy, order]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`, {
        headers: { Authorization: token },
      });
      setEmployees(prev => prev.filter(e => e.id !== id));
      setTotalEmployees(prev => prev - 1);
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
  console.log("employees =", employees);
  console.log("type =", typeof employees);
  console.log("isArray =", Array.isArray(employees));
  console.log("Employees State:", employees);
  const employeeList = Array.isArray(employees) ? employees : [];
  const filtered = employeeList.filter((e) =>
  [e.name, e.email, e.designation, e.department_name]
    .some((v) =>
      String(v || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
);

  return (
    <Layout>
      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>👥 All employees — {totalEmployees} total</h1>
          <div style={s.headerRight}>
            <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.search}
                placeholder="Search employees..."
                value={search}
                onChange={(e) => {
  setSearch(e.target.value);
  setPage(1);
}}
              />
            </div>
          <select
  value={department}
  onChange={(e) => {
    setDepartment(e.target.value);
    setPage(1);
  }}
  style={s.departmentSelect}
  
>
  <option value="">All Departments</option>
  <option>Software Development</option>
  <option>Human Resources</option>
  <option>Finance & Accounts</option>
  <option>Sales</option>
  <option>Digital Marketing</option>
</select>
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
    <th
      style={{ ...s.th, cursor: "pointer" }}
      onClick={() => {
        setSortBy("name");
        setOrder(order === "ASC" ? "DESC" : "ASC");
      }}
    >
      EMPLOYEE
    </th>

    <th style={s.th}>DESIGNATION</th>

    <th style={s.th}>DEPARTMENT</th>

    <th style={s.th}>PHONE</th>

    <th
      style={{ ...s.th, cursor: "pointer" }}
      onClick={() => {
        setSortBy("salary");
        setOrder(order === "ASC" ? "DESC" : "ASC");
      }}
    >
      SALARY
    </th>

    <th style={s.th}>ROLE</th>

    <th style={s.th}>ACTIONS</th>
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
              <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    padding: "20px",
  }}
>
  <button
    disabled={page === 1}
    onClick={() => setPage((p) => p - 1)}
    style={{
      padding: "8px 14px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      cursor: page === 1 ? "not-allowed" : "pointer",
    }}
  >
    Previous
  </button>

  <span>
    {Array.from(
  { length: totalPages },
  (_, i) => i + 1
)
.slice(
  Math.max(0, page - 3),
  Math.min(totalPages, page + 2)
)
.map((p) => (
  <button
    key={p}
    onClick={() => setPage(p)}
    style={{
      backgroundColor:
        page === p ? "#1a1f2e" : "#fff",
      color:
        page === p ? "#fff" : "#111827",
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: "8px 12px",
      cursor: "pointer"
    }}
  >
    {p}
  </button>
))}
  </span>

  <button
    disabled={page === totalPages}
    onClick={() => setPage((p) => p + 1)}
    style={{
      padding: "8px 14px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      cursor:
        page === totalPages ? "not-allowed" : "pointer",
    }}
  >
    Next
  </button>
</div>
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
departmentSelect: {
  height: "44px",
  minWidth: "220px",
  padding: "0 16px",
  borderRadius: "12px",
  border: "1px solid #dbe3ee",
  backgroundColor: "#fff",
  color: "#111827",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  outline: "none",
  transition: "all 0.2s ease",
},
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