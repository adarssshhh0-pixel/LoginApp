import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import { setCache, getCache } from "../utils/cache";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      // Check cache first
      const cached = getCache("employees");
      if (cached) {
        setEmployees(cached);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/employees", {
          headers: { Authorization: token },
        });
        setCache("employees", res.data, 30); // cache for 30 seconds
        setEmployees(res.data);
      } catch (err) {
        handleApiError(err, navigate);
        setError(err.response?.data?.message || "Failed to load");
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
    } catch (err) {
      handleApiError(err, navigate);
    }
  };

  if (loading) return <div style={styles.loading}>Loading employees...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>👥 Employee List</h1>
          <p style={styles.pageSub}>{employees.length} employees found</p>
        </div>
        <div style={styles.headerBtns}>
          <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
          <Link to="/employees/create"><button style={styles.addBtn}>➕ Add Employee</button></Link>
        </div>
      </div>

      {error && <div style={styles.errorBox}>❌ {error}</div>}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Designation</th>
              <th style={styles.th}>Salary</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={7} style={styles.empty}>No employees found. <Link to="/employees/create" style={{ color: "#1d4ed8" }}>Add one!</Link></td></tr>
            ) : (
              employees.map((emp, i) => (
                <tr key={emp.id} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}><span style={styles.empName}>{emp.name}</span></td>
                  <td style={styles.td}>{emp.email}</td>
                  <td style={styles.td}><span style={styles.deptBadge}>{emp.department_name}</span></td>
                  <td style={styles.td}>{emp.designation}</td>
                  <td style={styles.td}>₹{Number(emp.salary).toLocaleString()}</td>
                  <td style={styles.td}>
                    <Link to={`/employees/edit/${emp.id}`}>
                      <button style={styles.editBtn}>✏️ Edit</button>
                    </Link>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(emp.id)}>🗑️ Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  loading: { textAlign: "center", marginTop: 100, fontSize: 18, color: "#1d4ed8", fontFamily: "sans-serif" },
  wrapper: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 32, backgroundColor: "#eff6ff", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  headerBtns: { display: "flex", gap: 10 },
  backBtn: { padding: "8px 18px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  addBtn: { padding: "8px 18px", backgroundColor: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600" },
  errorBox: { backgroundColor: "#fee2e2", color: "#dc2626", padding: 16, borderRadius: 8, marginBottom: 16 },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(29,78,216,0.08)", overflow: "auto", border: "1px solid #dbeafe" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1d4ed8" },
  th: { padding: "14px 18px", color: "#fff", textAlign: "left", fontSize: 13, fontWeight: "600" },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "13px 18px", fontSize: 14, color: "#1e293b" },
  empty: { padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 15 },
  empName: { fontWeight: "600", color: "#1e3a8a" },
  deptBadge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: "600" },
  editBtn: { marginRight: 8, padding: "5px 12px", backgroundColor: "#d97706", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "600" },
  deleteBtn: { padding: "5px 12px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "600" },
};

export default EmployeeList;