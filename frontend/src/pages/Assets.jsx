import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";

function Assets() {
  const [assets, setAssets] = useState([]);
  const [allocated, setAllocated] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("assets");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [allocateForm, setAllocateForm] = useState({ asset_id: "", employee_id: "" });
  const [newAsset, setNewAsset] = useState({ asset_code: "", asset_name: "", asset_type: "", purchase_date: "", purchase_cost: "" });
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const headers = { Authorization: token };
      const [assetsRes, allocatedRes, statsRes, usersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/assets?search=${search}&status=${statusFilter}`, { headers }),
        axios.get("http://localhost:5000/api/assets/allocated", { headers }),
        axios.get("http://localhost:5000/api/assets/stats", { headers }),
        axios.get("http://localhost:5000/api/user/all", { headers }),
      ]);
      setAssets(assetsRes.data.assets || []);
      setAllocated(allocatedRes.data);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      handleApiError(err, navigate);
    }
  };

  useEffect(() => { fetchAll(); }, [search, statusFilter, token, navigate]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/assets", newAsset, { headers: { Authorization: token } });
      alert("Asset created!");
      setShowForm(false);
      fetchAll();
    } catch (err) {
      handleApiError(err, navigate);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/assets/allocate", allocateForm, { headers: { Authorization: token } });
      alert("Asset allocated!");
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const handleReturn = async (id) => {
    if (!window.confirm("Return this asset?")) return;
    try {
      await axios.put(`http://localhost:5000/api/assets/return/${id}`, { remarks: "Returned by employee" }, { headers: { Authorization: token } });
      alert("Asset returned!");
      fetchAll();
    } catch (err) {
      handleApiError(err, navigate);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "available") return { backgroundColor: "#dcfce7", color: "#16a34a" };
    if (status === "allocated") return { backgroundColor: "#dbeafe", color: "#2563eb" };
    return { backgroundColor: "#fee2e2", color: "#dc2626" };
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2>💻 Asset Management</h2>
        <Link to="/dashboard"><button style={styles.backBtn}>← Dashboard</button></Link>
      </div>

      {/* Stats */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, backgroundColor: "#4f46e5" }}>
            <div style={styles.statNum}>{stats.total}</div>
            <div style={styles.statLabel}>Total Assets</div>
          </div>
          <div style={{ ...styles.statCard, backgroundColor: "#16a34a" }}>
            <div style={styles.statNum}>{stats.available}</div>
            <div style={styles.statLabel}>Available</div>
          </div>
          <div style={{ ...styles.statCard, backgroundColor: "#d97706" }}>
            <div style={styles.statNum}>{stats.allocated}</div>
            <div style={styles.statLabel}>Allocated</div>
          </div>
          <div style={{ ...styles.statCard, backgroundColor: "#0891b2" }}>
            <div style={styles.statNum}>₹{stats.totalCost?.toLocaleString()}</div>
            <div style={styles.statLabel}>Total Value</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === "assets" ? styles.activeTab : {}) }} onClick={() => setTab("assets")}>All Assets</button>
        <button style={{ ...styles.tab, ...(tab === "allocated" ? styles.activeTab : {}) }} onClick={() => setTab("allocated")}>Allocated</button>
        {["admin", "hr"].includes(role) && (
          <button style={{ ...styles.tab, ...(tab === "allocate" ? styles.activeTab : {}) }} onClick={() => setTab("allocate")}>Allocate Asset</button>
        )}
      </div>

      {/* Assets Tab */}
      {tab === "assets" && (
        <>
          <div style={styles.filters}>
            <input style={styles.searchInput} placeholder="🔍 Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select style={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="allocated">Allocated</option>
            </select>
            {["admin", "hr"].includes(role) && (
              <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>➕ Add Asset</button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleCreateAsset} style={styles.form}>
              <input style={styles.input} placeholder="Asset Code (e.g. AST009)" value={newAsset.asset_code} onChange={(e) => setNewAsset({ ...newAsset, asset_code: e.target.value })} required />
              <input style={styles.input} placeholder="Asset Name" value={newAsset.asset_name} onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })} required />
              <select style={styles.input} value={newAsset.asset_type} onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })} required>
                <option value="">-- Asset Type --</option>
                <option>Laptop</option><option>Monitor</option><option>Mouse</option>
                <option>Keyboard</option><option>ID Card</option><option>Access Card</option>
              </select>
              <input style={styles.input} type="date" value={newAsset.purchase_date} onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })} required />
              <input style={styles.input} type="number" placeholder="Purchase Cost (₹)" value={newAsset.purchase_cost} onChange={(e) => setNewAsset({ ...newAsset, purchase_cost: e.target.value })} required />
              <button style={styles.submitBtn} type="submit">Create Asset</button>
            </form>
          )}

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead><tr style={styles.thead}>
                <th style={styles.th}>Code</th><th style={styles.th}>Name</th>
                <th style={styles.th}>Type</th><th style={styles.th}>Cost</th>
                <th style={styles.th}>Status</th>
              </tr></thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}>{a.asset_code}</td>
                    <td style={styles.td}>{a.asset_name}</td>
                    <td style={styles.td}>{a.asset_type}</td>
                    <td style={styles.td}>₹{a.purchase_cost?.toLocaleString()}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, ...getStatusStyle(a.status) }}>{a.status?.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Allocated Tab */}
      {tab === "allocated" && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead><tr style={styles.thead}>
              <th style={styles.th}>Asset</th><th style={styles.th}>Type</th>
              <th style={styles.th}>Employee</th><th style={styles.th}>Allocated Date</th>
              {["admin", "hr"].includes(role) && <th style={styles.th}>Action</th>}
            </tr></thead>
            <tbody>
              {allocated.length === 0 ? (
                <tr><td colSpan={5} style={styles.empty}>No allocated assets</td></tr>
              ) : allocated.map(a => (
                <tr key={a.id} style={styles.tr}>
                  <td style={styles.td}>{a.asset_name}</td>
                  <td style={styles.td}>{a.asset_type}</td>
                  <td style={styles.td}>{a.employee_name}</td>
                  <td style={styles.td}>{new Date(a.allocated_date).toLocaleDateString()}</td>
                  {["admin", "hr"].includes(role) && (
                    <td style={styles.td}>
                      <button style={styles.returnBtn} onClick={() => handleReturn(a.id)}>↩ Return</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocate Tab */}
      {tab === "allocate" && ["admin", "hr"].includes(role) && (
        <div style={styles.allocateCard}>
          <h3>Assign Asset to Employee</h3>
          <form onSubmit={handleAllocate} style={styles.form}>
            <select style={styles.input} value={allocateForm.asset_id} onChange={(e) => setAllocateForm({ ...allocateForm, asset_id: e.target.value })} required>
              <option value="">-- Select Available Asset --</option>
              {assets.filter(a => a.status === "available").map(a => (
                <option key={a.id} value={a.id}>{a.asset_code} — {a.asset_name}</option>
              ))}
            </select>
            <select style={styles.input} value={allocateForm.employee_id} onChange={(e) => setAllocateForm({ ...allocateForm, employee_id: e.target.value })} required>
              <option value="">-- Select Employee --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <button style={styles.submitBtn} type="submit">Allocate Asset</button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "sans-serif", padding: 32, backgroundColor: "#f9fafb", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  backBtn: { padding: "8px 16px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  statsGrid: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: 140, borderRadius: 10, padding: 20, color: "#fff", textAlign: "center" },
  statNum: { fontSize: 28, fontWeight: "bold" },
  statLabel: { fontSize: 13, marginTop: 4 },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: { padding: "8px 20px", backgroundColor: "#e2e8f0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  activeTab: { backgroundColor: "#4f46e5", color: "#fff" },
  filters: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  searchInput: { padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, flex: 1 },
  filterSelect: { padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 },
  addBtn: { padding: "8px 16px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  form: { backgroundColor: "#fff", padding: 20, borderRadius: 10, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12 },
  input: { padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, flex: 1, minWidth: 180 },
  submitBtn: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1e293b" },
  th: { padding: "12px 16px", color: "#fff", textAlign: "left", fontSize: 13 },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: 14 },
  empty: { padding: 32, textAlign: "center", color: "#94a3b8" },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "600" },
  returnBtn: { padding: "4px 12px", backgroundColor: "#d97706", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" },
  allocateCard: { backgroundColor: "#fff", borderRadius: 12, padding: 24, maxWidth: 500, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
};

export default Assets;