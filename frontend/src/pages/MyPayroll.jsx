import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiError";
import Layout from "../components/Layout";

const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function MyPayroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchDetails = useCallback(
    async (id) => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/payroll/details/${id}`,
          {
            headers: { Authorization: token },
          },
        );
        setSelected(res.data.payroll);
        setDetails(res.data.details);
      } catch (err) {
        handleApiError(err, navigate);
      }
    },
    [token, navigate],
  );

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/payroll/my", {
          headers: { Authorization: token },
        });
        setPayrolls(res.data);
        if (res.data.length > 0) fetchDetails(res.data[0].id);
      } catch (err) {
        handleApiError(err, navigate);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token, navigate, fetchDetails]);

  const handleDownload = (id) => {
    window.open(
      `http://localhost:5000/api/payroll/slip/${id}?token=${token}`,
      "_blank",
    );
  };

  const getStatusStyle = (status) => {
    if (status === "paid")
      return { backgroundColor: "#dcfce7", color: "#059669" };
    if (status === "processed")
      return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    return { backgroundColor: "#fef3c7", color: "#d97706" };
  };

  if (loading) return <div style={styles.loading}>Loading payslips...</div>;

  const earnings = details.filter((d) => d.component_type === "earning");
  const deductions = details.filter((d) => d.component_type === "deduction");

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>💰 My Payslips</h1>
          <p style={styles.pageSub}>
            Your salary history and payslip downloads
          </p>
        </div>
        <Link to="/dashboard">
          <button style={styles.backBtn}>← Dashboard</button>
        </Link>
      </div>
      {payrolls.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <p style={{ fontSize: 18, fontWeight: "700", color: "#1e3a8a" }}>
            No payslips yet
          </p>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>
            Your payslips will appear here once payroll is processed.
          </p>
        </div>
      ) : (
        <div style={styles.mainGrid}>
          {/* Left — Payslip List */}
          <div style={styles.listCard}>
            <h3 style={styles.listTitle}>📋 Payslip History</h3>
            {payrolls.map((p) => (
              <div
                key={p.id}
                style={{
                  ...styles.listItem,
                  ...(selected?.id === p.id ? styles.listItemActive : {}),
                }}
                onClick={() => fetchDetails(p.id)}
              >
                <div style={styles.listItemLeft}>
                  <div style={styles.listMonth}>
                    {MONTHS[p.month]} {p.year}
                  </div>
                  <div style={styles.listNet}>
                    ₹{Number(p.net_salary).toLocaleString()}
                  </div>
                </div>
                <span style={{ ...styles.badge, ...getStatusStyle(p.status) }}>
                  {p.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Right — Payslip Details */}
          {selected && (
            <div style={styles.detailCard}>
              {/* Payslip Header */}
              <div style={styles.slipHeader}>
                <div>
                  <h2 style={styles.slipTitle}>Salary Slip</h2>
                  <p style={styles.slipMonth}>
                    {MONTHS[selected.month]} {selected.year}
                  </p>
                </div>
                <button
                  style={styles.downloadBtn}
                  onClick={() => handleDownload(selected.id)}
                >
                  📄 Download PDF
                </button>
              </div>

              {/* Employee Info */}
              <div style={styles.empInfo}>
                <div style={styles.empAvatar}>{selected.name?.charAt(0)}</div>
                <div>
                  <div style={styles.empName}>{selected.name}</div>
                  <div style={styles.empSub}>
                    {selected.designation} • {selected.department_name}
                  </div>
                </div>
                <div style={styles.attInfo}>
                  <div style={styles.attDays}>
                    {selected.present_days}/{selected.working_days}
                  </div>
                  <div style={styles.attLabel}>Days Present</div>
                </div>
              </div>

              {/* Net Salary Banner */}
              <div style={styles.netBanner}>
                <div>
                  <div style={styles.netLabel}>Net Take Home</div>
                  <div style={styles.netAmount}>
                    ₹{Number(selected.net_salary).toLocaleString()}
                  </div>
                </div>
                <div style={styles.netRight}>
                  <div style={styles.netItem}>
                    <span style={styles.netItemLabel}>Gross</span>
                    <span style={styles.netItemValue}>
                      ₹{Number(selected.gross_salary).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.netItem}>
                    <span style={styles.netItemLabel}>Deductions</span>
                    <span style={{ ...styles.netItemValue, color: "#fca5a5" }}>
                      -₹{Number(selected.total_deductions).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div style={styles.breakdownGrid}>
                <div style={styles.breakdownSection}>
                  <h4 style={styles.breakdownTitle}>✅ Earnings</h4>
                  {earnings.map((e) => (
                    <div key={e.id} style={styles.breakdownRow}>
                      <span style={styles.breakdownLabel}>
                        {e.component_name}
                      </span>
                      <span style={styles.breakdownAmount}>
                        ₹{Number(e.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      ...styles.breakdownRow,
                      borderTop: "1.5px solid #dbeafe",
                      marginTop: 8,
                      paddingTop: 8,
                    }}
                  >
                    <span
                      style={{
                        ...styles.breakdownLabel,
                        fontWeight: "700",
                        color: "#1e3a8a",
                      }}
                    >
                      Total Earnings
                    </span>
                    <span
                      style={{
                        ...styles.breakdownAmount,
                        fontWeight: "700",
                        color: "#059669",
                      }}
                    >
                      ₹{Number(selected.gross_salary).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={styles.breakdownSection}>
                  <h4 style={{ ...styles.breakdownTitle, color: "#dc2626" }}>
                    ❌ Deductions
                  </h4>
                  {deductions.map((d) => (
                    <div key={d.id} style={styles.breakdownRow}>
                      <span style={styles.breakdownLabel}>
                        {d.component_name}
                      </span>
                      <span
                        style={{ ...styles.breakdownAmount, color: "#dc2626" }}
                      >
                        -₹{Number(d.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      ...styles.breakdownRow,
                      borderTop: "1.5px solid #fecaca",
                      marginTop: 8,
                      paddingTop: 8,
                    }}
                  >
                    <span
                      style={{
                        ...styles.breakdownLabel,
                        fontWeight: "700",
                        color: "#1e3a8a",
                      }}
                    >
                      Total Deductions
                    </span>
                    <span
                      style={{
                        ...styles.breakdownAmount,
                        fontWeight: "700",
                        color: "#dc2626",
                      }}
                    >
                      -₹{Number(selected.total_deductions).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </Layout>
  );
}

const styles = {
  loading: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
    color: "#1d4ed8",
    fontFamily: "sans-serif",
  },
 wrapper: {
  fontFamily: "'Inter','Segoe UI',sans-serif",
  backgroundColor: "transparent",
  marginBottom: 20
},
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
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
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 60,
    textAlign: "center",
    border: "1px solid #dbeafe",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: 20,
    alignItems: "start",
  },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #dbeafe",
    boxShadow: "0 2px 8px rgba(29,78,216,0.06)",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 16,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 8,
    border: "1px solid transparent",
  },
  listItemActive: { backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" },
  listItemLeft: {},
  listMonth: { fontSize: 14, fontWeight: "600", color: "#1e3a8a" },
  listNet: { fontSize: 12, color: "#64748b", marginTop: 2 },
  badge: {
    padding: "3px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: "700",
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 28,
    border: "1px solid #dbeafe",
    boxShadow: "0 2px 8px rgba(29,78,216,0.06)",
  },
  slipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  slipTitle: { fontSize: 20, fontWeight: "700", color: "#1e3a8a", margin: 0 },
  slipMonth: { fontSize: 13, color: "#64748b", marginTop: 2 },
  downloadBtn: {
    padding: "10px 20px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "700",
    fontSize: 13,
  },
  empInfo: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    marginBottom: 20,
    border: "1px solid #dbeafe",
  },
  empAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: "700",
    flexShrink: 0,
  },
  empName: { fontSize: 15, fontWeight: "700", color: "#1e3a8a" },
  empSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  attInfo: { marginLeft: "auto", textAlign: "center" },
  attDays: { fontSize: 20, fontWeight: "700", color: "#1d4ed8" },
  attLabel: { fontSize: 11, color: "#94a3b8" },
  netBanner: {
    background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: { fontSize: 13, color: "#bfdbfe", marginBottom: 4 },
  netAmount: { fontSize: 32, fontWeight: "800", color: "#fff" },
  netRight: { textAlign: "right" },
  netItem: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  netItemLabel: { fontSize: 12, color: "#bfdbfe" },
  netItemValue: { fontSize: 13, fontWeight: "700", color: "#fff" },
  breakdownGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  breakdownSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 16,
    border: "1px solid #dbeafe",
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 12,
  },
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 0",
    borderBottom: "0.5px solid #f1f5f9",
  },
  breakdownLabel: { fontSize: 13, color: "#374151" },
  breakdownAmount: { fontSize: 13, fontWeight: "600", color: "#1e3a8a" },
};

export default MyPayroll;
