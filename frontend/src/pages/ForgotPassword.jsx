import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Step 1 — Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email,
      });
      setStep(2);
      setMessage("OTP sent! Check your email inbox.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP & Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handler — auto focus next box
  const handleOtpChange = (value) => {
    if (/^\d{0,6}$/.test(value)) setOtp(value);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <img
              src="https://images.jdmagicbox.com/comp/indore/s9/0731px731.x731.170921193503.a4s9/catalogue/i-softzone-mg-road-indore-indore-barcode-computer-software-dealers-rd3jw85c1d.jpg"
              alt="logo"
              height={48}
            />
          </div>
          <div style={styles.logoText}>i-SOFTZONE</div>
          <div style={styles.logoSub}>Password Recovery</div>
        </div>

        {/* Progress Steps */}
        <div style={styles.steps}>
          <div style={styles.stepItem}>
            <div
              style={{
                ...styles.stepCircle,
                backgroundColor: "#1d4ed8",
                color: "#fff",
              }}
            >
              1
            </div>
            <div style={{ ...styles.stepLabel, color: "#1d4ed8" }}>
              Enter Email
            </div>
          </div>
          <div
            style={{
              ...styles.stepLine,
              backgroundColor: step >= 2 ? "#1d4ed8" : "#dbeafe",
            }}
          />
          <div style={styles.stepItem}>
            <div
              style={{
                ...styles.stepCircle,
                backgroundColor: step >= 2 ? "#1d4ed8" : "#dbeafe",
                color: step >= 2 ? "#fff" : "#94a3b8",
              }}
            >
              2
            </div>
            <div
              style={{
                ...styles.stepLabel,
                color: step >= 2 ? "#1d4ed8" : "#94a3b8",
              }}
            >
              Verify OTP
            </div>
          </div>
          <div
            style={{
              ...styles.stepLine,
              backgroundColor: success ? "#059669" : "#dbeafe",
            }}
          />
          <div style={styles.stepItem}>
            <div
              style={{
                ...styles.stepCircle,
                backgroundColor: success ? "#059669" : "#dbeafe",
                color: success ? "#fff" : "#94a3b8",
              }}
            >
              3
            </div>
            <div
              style={{
                ...styles.stepLabel,
                color: success ? "#059669" : "#94a3b8",
              }}
            >
              Done
            </div>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✅</div>
            <h3 style={styles.successTitle}>Password Reset Successful!</h3>
            <p style={styles.successSub}>
              Redirecting to login page in 3 seconds...
            </p>
          </div>
        ) : step === 1 ? (
          /* Step 1 — Email Form */
          <>
            <h2 style={styles.heading}>Forgot Password?</h2>
            <p style={styles.sub}>
              Enter your registered email and we'll send you a 6-digit OTP.
            </p>
            <form onSubmit={handleSendOTP} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {message && <div style={styles.errorMsg}>❌ {message}</div>}
              <button
                style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP →"}
              </button>
            </form>
          </>
        ) : (
          /* Step 2 — OTP + New Password */
          <>
            <h2 style={styles.heading}>Enter OTP & New Password</h2>
            <div style={styles.emailSentBox}>
              📧 OTP sent to <strong>{email}</strong>
              <button
                style={styles.changeEmailBtn}
                onClick={() => {
                  setStep(1);
                  setMessage("");
                }}
              >
                Change email
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={styles.form}>
              {/* OTP Input */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>6-Digit OTP</label>
                <input
                  style={styles.otpInput}
                  type="text"
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  required
                />
                <span style={styles.otpHint}>
                  {otp.length}/6 digits entered
                </span>
              </div>

              {/* New Password */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>New Password</label>
                <PasswordInput
                  name="newPassword"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              {/* Confirm Password */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Confirm Password</label>
                <PasswordInput
                  name="confirmPassword"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    borderColor:
                      confirmPassword && confirmPassword !== newPassword
                        ? "#dc2626"
                        : "#bfdbfe",
                  }}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <span style={{ fontSize: 12, color: "#dc2626" }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              {message && (
                <div
                  style={{
                    ...styles.errorMsg,
                    backgroundColor: message.includes("sent")
                      ? "#dcfce7"
                      : "#fee2e2",
                    color: message.includes("sent") ? "#059669" : "#dc2626",
                    border: `1px solid ${message.includes("sent") ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {message.includes("sent") ? "✅" : "❌"} {message}
                </div>
              )}

              <button
                style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                type="submit"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password →"}
              </button>

              {/* Resend OTP */}
              <button
                type="button"
                style={styles.resendBtn}
                onClick={handleSendOTP}
                disabled={loading}
              >
                🔄 Resend OTP
              </button>
            </form>
          </>
        )}

        <div style={styles.links}>
          <Link to="/" style={styles.link}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 4px 24px rgba(29,78,216,0.10)",
    border: "1px solid #dbeafe",
  },
  logoArea: { textAlign: "center", marginBottom: 24 },
  logoIcon: { fontSize: 36, marginBottom: 6 },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e40af",
    letterSpacing: 1,
  },
  logoSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  steps: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  stepLabel: { fontSize: 11, fontWeight: "600", whiteSpace: "nowrap" },
  stepLine: { width: 48, height: 2, margin: "0 8px", marginBottom: 16 },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a8a",
    margin: "0 0 6px",
  },
  sub: { fontSize: 13, color: "#64748b", marginBottom: 24 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#1e40af" },
  input: {
    padding: "11px 14px",
    fontSize: 14,
    borderRadius: 8,
    border: "1.5px solid #bfdbfe",
    backgroundColor: "#f8fafc",
    fontFamily: "inherit",
  },
  otpInput: {
    padding: "14px",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 16,
    textAlign: "center",
    borderRadius: 8,
    border: "2px solid #1d4ed8",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontFamily: "monospace",
  },
  otpHint: { fontSize: 11, color: "#94a3b8", textAlign: "right" },
  button: {
    padding: "13px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: "700",
    cursor: "pointer",
  },
  resendBtn: {
    padding: "10px",
    backgroundColor: "transparent",
    color: "#1d4ed8",
    border: "1.5px solid #bfdbfe",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "600",
    cursor: "pointer",
  },
  errorMsg: {
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  emailSentBox: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#1e40af",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  changeEmailBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#dc2626",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: "600",
    textDecoration: "underline",
  },
  successBox: { textAlign: "center", padding: "20px 0" },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 8,
  },
  successSub: { fontSize: 14, color: "#64748b" },
  links: { textAlign: "center", marginTop: 20, fontSize: 13 },
  link: { color: "#1d4ed8", textDecoration: "none", fontWeight: "500" },
};

export default ForgotPassword;
