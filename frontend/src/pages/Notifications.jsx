import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import Layout from "../components/Layout";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: token },
      });
      setNotifications(res.data);
    } catch (err) {
      handleApiError(err, navigate);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    await axios.put(
      "http://localhost:5000/api/notifications/mark-read",
      {},
      { headers: { Authorization: token } },
    );
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
      headers: { Authorization: token },
    });
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>
            🔔 Notifications
            {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
          </h1>
          <p style={styles.pageSub}>
            {notifications.length} total notifications
          </p>
        </div>
        <div style={styles.headerBtns}>
          <button style={styles.readBtn} onClick={markAllRead}>
            ✅ Mark All Read
          </button>
          <Link to="/dashboard">
            <button style={styles.backBtn}>← Dashboard</button>
          </Link>
        </div>
      </div>
      <div style={styles.list}>
        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <p style={{ fontSize: 18, fontWeight: "600", color: "#1e3a8a" }}>
              No notifications yet
            </p>
            <p style={{ fontSize: 14, color: "#94a3b8" }}>
              You'll see leave approvals and asset assignments here
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                ...styles.item,
                backgroundColor: n.is_read ? "#fff" : "#eff6ff",
                borderLeft: n.is_read
                  ? "4px solid #e2e8f0"
                  : "4px solid #1d4ed8",
              }}
            >
              <div style={styles.itemContent}>
                <div style={styles.notifTitle}>{n.title}</div>
                <div style={styles.notifMessage}>{n.message}</div>
                <div style={styles.notifTime}>
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </div>
              </div>
              <button
                style={styles.deleteBtn}
                onClick={() => deleteNotification(n.id)}
              >
                ✕
              </button>
            </div>
          ))
        )}
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
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e3a8a",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    backgroundColor: "#dc2626",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 8px",
    fontSize: 13,
  },
  pageSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  headerBtns: { display: "flex", gap: 10 },
  readBtn: {
    padding: "8px 18px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
  },
  backBtn: {
    padding: "8px 18px",
    backgroundColor: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
  },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 2px 6px rgba(29,78,216,0.05)",
    border: "1px solid #dbeafe",
  },
  itemContent: { flex: 1 },
  notifTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1e3a8a",
    marginBottom: 4,
  },
  notifMessage: { fontSize: 14, color: "#475569" },
  notifTime: { fontSize: 12, color: "#94a3b8", marginTop: 6 },
  deleteBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
  },
  empty: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 60,
    textAlign: "center",
    border: "1px solid #dbeafe",
  },
};

export default Notifications;
