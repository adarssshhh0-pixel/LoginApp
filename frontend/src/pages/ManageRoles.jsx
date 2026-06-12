import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import Layout from "../components/Layout";

function ManageRoles() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user/all", {
          headers: { Authorization: token },
        });
        setUsers(res.data);
      } catch (err) {
        handleApiError(err, navigate);
      }
    };

    fetchUsers();
  }, [token, navigate]);

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.put(
        `http://localhost:5000/api/user/role/${id}`,
        { role: newRole },
        { headers: { Authorization: token } },
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)),
      );
      alert("Role updated successfully!");
    } catch (err) {
      handleApiError(err, navigate);
    }
  };

  const getRoleBadgeStyle = (role) => {
    if (role === "admin")
      return { backgroundColor: "#fee2e2", color: "#dc2626" };
    if (role === "manager")
      return { backgroundColor: "#ffedd5", color: "#d97706" };
    if (role === "hr") return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    return { backgroundColor: "#dcfce7", color: "#059669" };
  };

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>🔐 Manage Roles</h1>
          <p style={styles.pageSub}>Control user access permissions</p>
        </div>
        <Link to="/dashboard">
          <button style={styles.backBtn}>← Dashboard</button>
        </Link>
      </div>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Current Role</th>
              <th style={styles.th}>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={styles.tr}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>
                  <span style={{ fontWeight: "600", color: "#1e3a8a" }}>
                    {u.name}
                  </span>
                </td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>
                  <span
                    style={{ ...styles.badge, ...getRoleBadgeStyle(u.role) }}
                  >
                    {u.role?.toUpperCase() || "N/A"}
                  </span>
                </td>
                <td style={styles.td}>
                  <select
                    style={styles.select}
                    value={u.role || "employee"}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
  );
}

const styles = {
  wrapper: {
    fontFamily: "'Inter','Segoe UI',sans-serif",
    backgroundColor: "transparent",
    marginBottom: 20
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  backBtn: {
    padding: "8px 18px",
    backgroundColor: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(29,78,216,0.08)",
    overflow: "auto",
    border: "1px solid #dbeafe",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1d4ed8" },
  th: {
    padding: "14px 18px",
    color: "#fff",
    textAlign: "left",
    fontSize: 13,
    fontWeight: "600",
  },
  tr: { borderBottom: "1px solid #eff6ff" },
  td: { padding: "13px 18px", fontSize: 14, color: "#1e293b" },
  badge: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "600",
  },
  select: {
    padding: "7px 12px",
    borderRadius: 6,
    border: "1.5px solid #bfdbfe",
    fontSize: 14,
    cursor: "pointer",
    backgroundColor: "#f8fafc",
  },
};

export default ManageRoles;
