import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ForgotPasswordPage = () => {
  const { forgotPassword, verifyOtp, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const otpRefs = useRef([]);
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Start countdown when step 2 is reached
  useEffect(() => {
    if (step === 2) {
      setTimer(60);
      setTimerActive(true);
    }
  }, [step]);

  // Countdown tick
  useEffect(() => {
    if (!timerActive) return;
    if (timer <= 0) {
      setTimerActive(false);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Format seconds → MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Step 1 — Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setServerError("Email is required.");
    try {
      setLoading(true);
      setServerError("");
      await forgotPassword(email);
      setSuccessMessage("OTP sent! Check your backend console.");
      setStep(2);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      setServerError("");
      await forgotPassword(email);
      setSuccessMessage("New OTP sent! Check your backend console.");
      setTimer(60);
      setTimerActive(true);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.join("").length < 6)
      return setServerError("Please enter the complete 6-digit OTP.");
    if (timer <= 0) return setServerError("OTP has expired. Please resend.");
    try {
      setLoading(true);
      setServerError("");
      const res = await verifyOtp(email, otp.join(""));
      if (res.data?.success === false) {
        setServerError("Invalid OTP. Please try again.");
        return;
      }
      setSuccessMessage("OTP verified! Set your new password.");
      setTimerActive(false);
      setStep(3);
    } catch (err) {
      setServerError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };
  // State & Refs

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => (newOtp[i] = char));
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)].focus();
  };
  // Step 3 — Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword)
      return setServerError("All fields are required.");
    if (newPassword !== confirmPassword)
      return setServerError("Passwords do not match.");
    if (newPassword.length < 6)
      return setServerError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      setServerError("");
      await updatePassword(email, otp.join(""), newPassword);
      setSuccessMessage(
        "Password updated successfully! Redirecting to login...",
      );
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Failed to update password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-amazon">Shop</span>
            <span className="logo-in">.in</span>
          </Link>
          <h1>Forgot Password</h1>
          <p>
            {step === 1 && "Enter your email to receive an OTP."}
            {step === 2 && "Enter the OTP sent to your email."}
            {step === 3 && "Set your new password."}
          </p>
          <div className="auth-steps">
            <div className={`auth-step ${step >= 1 ? "active" : ""}`}>
              <span>1</span> Email
            </div>
            <div className="auth-step-line" />
            <div className={`auth-step ${step >= 2 ? "active" : ""}`}>
              <span>2</span> OTP
            </div>
            <div className="auth-step-line" />
            <div className={`auth-step ${step >= 3 ? "active" : ""}`}>
              <span>3</span> Password
            </div>
          </div>
        </div>

        {serverError && <div className="auth-error">{serverError}</div>}
        {successMessage && <div className="auth-success">{successMessage}</div>}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setServerError("");
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>OTP *</label>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => (e.target.style.borderColor = "#e94560")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    style={{
                      width: "3rem",
                      height: "3.5rem",
                      textAlign: "center",
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      border: "2px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      outline: "none",
                      caretColor: "transparent",
                      transition: "border-color 0.2s",
                    }}
                  />
                ))}
              </div>

              {/* ⏱ Timer + Resend */}
              <div className="otp-timer-row">
                {timer > 0 ? (
                  <span
                    className={`otp-timer ${timer <= 60 ? "otp-timer-warning" : ""}`}
                  >
                    ⏱ OTP expires in {formatTime(timer)}
                  </span>
                ) : (
                  <span className="otp-timer otp-timer-expired">
                    OTP expired
                  </span>
                )}

                <button
                  type="button"
                  className="otp-resend-btn"
                  onClick={handleResendOtp}
                  disabled={timer > 0 || resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </div>

            <div className="auth-btn-row">
              <button
                type="button"
                className="btn btn-outline auth-btn"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary auth-btn"
                disabled={loading || timer <= 0}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setServerError("");
                }}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setServerError("");
                }}
              />
            </div>
            <div className="auth-btn-row">
              <button
                type="button"
                className="btn btn-outline auth-btn"
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary auth-btn"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
