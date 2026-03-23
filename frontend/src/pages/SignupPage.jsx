// src/pages/SignupPage.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { signupStep1Schema, validate } from "../utils/validate";
import LocationDropdowns, {
  validatePhone,
} from "../components/LocationDropdowns";
import "./AuthPage.css";

const SignupPage = () => {
  const { register, sendSignupOtp, verifySignupOtp } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const otpRefs = useRef([]);

  // Step 1 — name, email, password only
  const [form1, setForm1] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors1, setErrors1] = useState({});

  // Step 3 — address + location + phone
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [locationIds, setLocationIds] = useState({
    countryId: null,
    stateId: null,
    cityId: null,
    postalCode: "",
    phoneCode: "",
    phone: "",
  });
  const [locationErrors, setLocationErrors] = useState({});

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    if (timer <= 0) {
      setTimerActive(false);
      return;
    }
    const interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 5) otpRefs.current[index + 1].focus();
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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange1 = (e) => {
    setForm1({ ...form1, [e.target.name]: e.target.value });
    setErrors1((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    const errs = validate(signupStep1Schema, form1);
    if (Object.keys(errs).length > 0) {
      setErrors1(errs);
      return;
    }
    try {
      setLoading(true);
      setServerError("");
      await sendSignupOtp(form1.email);
      setStep1Data(form1);
      setTimer(600);
      setTimerActive(true);
      setSuccessMessage(`OTP sent to ${form1.email}`);
      setStep(2);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (!otpValue || otpValue.length < 6) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }
    if (timer <= 0) {
      setOtpError("OTP expired. Please resend.");
      return;
    }
    try {
      setLoading(true);
      setOtpError("");
      setServerError("");
      await verifySignupOtp(step1Data.email, otpValue);
      setSuccessMessage("Email verified! Complete your address.");
      setTimerActive(false);
      setStep(3);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      setOtpError("");
      await sendSignupOtp(step1Data.email);
      setTimer(600);
      setTimerActive(true);
      setOtp(["", "", "", "", "", ""]);
      setSuccessMessage("New OTP sent!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!address || address.trim().length < 5)
      errs.address = "Address must be at least 5 characters";
    if (!locationIds.countryId) errs.countryId = "Country is required";
    if (!locationIds.stateId) errs.stateId = "State is required";
    if (!locationIds.cityId) errs.cityId = "City is required";
    if (!locationIds.postalCode || locationIds.postalCode.trim().length < 3)
      errs.postalCode = "Enter a valid postal code";

    // ✅ libphonenumber-js validation
    const phoneErr = validatePhone(locationIds.phoneCode, locationIds.phone);
    if (phoneErr) errs.phone = phoneErr;

    if (Object.keys(errs).length > 0) {
      setAddressError(errs.address || "");
      setLocationErrors(errs);
      return;
    }

    try {
      setLoading(true);
      setServerError("");
      const fullPhone = `${locationIds.phoneCode}${locationIds.phone}`;
      await register(
        step1Data.name,
        step1Data.email,
        step1Data.password,
        fullPhone,
        address,
        locationIds.countryId,
        locationIds.stateId,
        locationIds.cityId,
        locationIds.postalCode, // string
      );
      setSuccessMessage("🎉 Account created successfully! Please login.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-amazon">Shop</span>
            <span className="logo-in">.in</span>
          </Link>
          <h1>Create Account</h1>
          <p>Join us today! It's free.</p>
          <div className="auth-steps">
            <div className={`auth-step ${step >= 1 ? "active" : ""}`}>
              <span>1</span> Account
            </div>
            <div className="auth-step-line" />
            <div className={`auth-step ${step >= 2 ? "active" : ""}`}>
              <span>2</span> Verify
            </div>
            <div className="auth-step-line" />
            <div className={`auth-step ${step >= 3 ? "active" : ""}`}>
              <span>3</span> Address
            </div>
          </div>
        </div>

        {serverError && <div className="auth-error">{serverError}</div>}
        {successMessage && <div className="auth-success">{successMessage}</div>}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleStep1}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form1.name}
                onChange={handleChange1}
                className={errors1.name ? "input-error" : ""}
              />
              {errors1.name && (
                <span className="field-error">{errors1.name}</span>
              )}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form1.email}
                onChange={handleChange1}
                className={errors1.email ? "input-error" : ""}
              />
              {errors1.email && (
                <span className="field-error">{errors1.email}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <div className="input-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min 6 chars, 1 uppercase, 1 number"
                    value={form1.password}
                    onChange={handleChange1}
                    className={errors1.password ? "input-error" : ""}
                  />
                  <button
                    type="button"
                    className="password-eye-btn"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors1.password && (
                  <span className="field-error">{errors1.password}</span>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <div className="input-password-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={form1.confirmPassword}
                    onChange={handleChange1}
                    className={errors1.confirmPassword ? "input-error" : ""}
                  />
                  <button
                    type="button"
                    className="password-eye-btn"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                  >
                    {showConfirmPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors1.confirmPassword && (
                  <span className="field-error">{errors1.confirmPassword}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Continue →"}
            </button>
          </form>
        )}

        {/* ── Step 2 — OTP ── */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="otp-verify-info">
              <div className="otp-verify-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <p className="otp-verify-title">Check your email</p>
                <p className="otp-verify-sub">
                  We sent a 6-digit OTP to <strong>{step1Data?.email}</strong>
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Enter OTP *</label>
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
              {otpError && <span className="field-error">{otpError}</span>}
              <div className="otp-timer-row">
                {timer > 0 ? (
                  <span
                    className={`otp-timer ${timer <= 60 ? "otp-timer-warning" : ""}`}
                  >
                    ⏱ Expires in {formatTime(timer)}
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
                onClick={() => {
                  setStep(1);
                  setOtp(["", "", "", "", "", ""]);
                  setOtpError("");
                }}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary auth-btn"
                disabled={loading || timer <= 0}
              >
                {loading ? "Verifying..." : "Verify Email →"}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3 — Address + Location + Phone ── */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleStep3}>
            <div className="form-group">
              <label>Street Address *</label>
              <input
                type="text"
                placeholder="House/Flat, Street, Area"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setAddressError("");
                }}
                className={addressError ? "input-error" : ""}
              />
              {addressError && (
                <span className="field-error">{addressError}</span>
              )}
            </div>

            <LocationDropdowns
              value={locationIds}
              onChange={setLocationIds}
              errors={locationErrors}
              showPhone={true}
            />

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
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
