import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  forgotPassword,
  verifyOtp,
  updatePassword,
} from "../redux/slices/authSlice";
import { FiTruck, FiRefreshCw, FiShield } from "react-icons/fi";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const otpRefs = useRef([]);
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (step === 2) {
      setTimer(60);
      setTimerActive(true);
    }
  }, [step]);

  useEffect(() => {
    if (!timerActive) return;
    if (timer <= 0) {
      setTimerActive(false);
      return;
    }
    const interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setServerError("Email is required.");
    try {
      setLoading(true);
      setServerError("");
      await forgotPassword(email);
      setSuccessMessage("OTP sent! Check your email.");
      setStep(2);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      setServerError("");
      setOtpError("");
      await forgotPassword(email);
      setSuccessMessage("New OTP sent!");
      setTimer(60);
      setTimerActive(true);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.join("").length < 6)
      return setOtpError("Enter the complete 6-digit OTP.");
    if (timer <= 0) return setOtpError("OTP expired. Please resend.");
    try {
      setLoading(true);
      setServerError("");
      setOtpError("");
      const res = await verifyOtp(email, otp.join(""));
      if (res.data?.success === false) {
        setOtpError("Invalid OTP. Please try again.");
        return;
      }
      setSuccessMessage("OTP verified! Set your new password.");
      setTimerActive(false);
      setStep(3);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };
  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1].focus();
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
      setSuccessMessage("Password updated! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Failed to update password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }) =>
    visible ? (
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
    );

  const inp = (hasErr) =>
    `w-full border-b-2 ${hasErr ? "border-red-400" : "border-[#d4d5d9]"} bg-transparent px-0 py-2.5 text-sm text-[#3e4152] placeholder-[#9ea0a9] focus:outline-none focus:border-[#ff3f6c] transition-colors`;

  const steps = [
    { n: 1, label: "Email" },
    { n: 2, label: "OTP" },
    { n: 3, label: "Password" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-[#fff0f3] flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#ff3f6c]/10" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-[#ff3f6c]/10" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <Link to="/" className="inline-block mb-8">
            <img src="/logo.ico" alt="Myntra" className="h-12 w-auto mx-auto" />
          </Link>

          <h2 className="text-3xl font-extrabold text-[#3e4152] leading-tight mb-3">
            India's Fashion
            <br />
            Destination
          </h2>

          <p className="text-sm text-[#535766] leading-relaxed max-w-xs mx-auto">
            Explore millions of styles from top brands — delivered to your door.
          </p>

          {/* Trust badges */}
          <div className="mt-10 space-y-3">
            {[
              {
                icon: <FiTruck />,
                text: "Free delivery on your first order",
              },
              {
                icon: <FiRefreshCw />,
                text: "30-day easy returns",
              },
              {
                icon: <FiShield />,
                text: "100% secure payments",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm text-left hover:shadow-md transition"
              >
                {/* Icon */}
                <div className="text-[#ff3f6c] text-lg">{item.icon}</div>

                {/* Text */}
                <span className="text-sm font-medium text-[#3e4152]">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <img
                src="/logo.ico"
                alt="Myntra"
                className="h-10 w-auto mx-auto"
              />
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold text-[#3e4152] mb-1">
            Forgot Password?
          </h1>
          <p className="text-sm text-[#535766] mb-6">
            {step === 1 && "Enter your email to receive a reset OTP."}
            {step === 2 && "Enter the OTP sent to your email."}
            {step === 3 && "Set your new password."}
          </p>

          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                      step > s.n
                        ? "bg-[#ff3f6c] text-white"
                        : step === s.n
                          ? "bg-[#ff3f6c] text-white ring-4 ring-[#ff3f6c]/20"
                          : "bg-[#eaeaec] text-[#9ea0a9]"
                    }`}
                  >
                    {step > s.n ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s.n
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 ${step >= s.n ? "text-[#ff3f6c]" : "text-[#9ea0a9]"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${step > s.n ? "bg-[#ff3f6c]" : "bg-[#eaeaec]"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Alerts */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5 font-medium flex items-start gap-2">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverError}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-5 font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* ── Step 1 – Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#535766] uppercase tracking-wider mb-1.5">
                  Registered Email *
                </label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setServerError("");
                  }}
                  className={inp(!email && serverError)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff3f6c] hover:bg-[#e8365d] text-white font-extrabold text-sm py-4 rounded-lg transition-colors disabled:opacity-60 tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#ff3f6c]/25"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          )}

          {/* ── Step 2 – OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Email hint */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-[#ff3f6c]/20 bg-[#fff8f9]">
                <div className="w-9 h-9 bg-[#ff3f6c]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff3f6c"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#3e4152]">
                    OTP sent to
                  </p>
                  <p className="text-sm font-extrabold text-[#ff3f6c]">
                    {email}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#535766] uppercase tracking-wider mb-3">
                  Enter OTP *
                </label>
                <div className="flex gap-3 justify-center">
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
                      className={`w-11 text-center text-xl font-extrabold border-b-2 ${
                        digit ? "border-[#ff3f6c]" : "border-[#d4d5d9]"
                      } bg-transparent py-2 focus:outline-none focus:border-[#ff3f6c] transition-colors caret-transparent`}
                      style={{ height: "3rem" }}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {otpError}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span
                    className={`font-semibold ${timer <= 30 ? "text-red-500" : "text-[#535766]"}`}
                  >
                    {timer > 0
                      ? `⏱ Expires in ${formatTime(timer)}`
                      : "OTP expired"}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0 || resendLoading}
                    className="text-[#ff3f6c] font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-[#d4d5d9] text-[#3e4152] font-bold text-sm py-3 rounded-lg hover:border-[#3e4152] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || timer <= 0}
                  className="flex-1 bg-[#ff3f6c] hover:bg-[#e8365d] text-white font-extrabold text-sm py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#ff3f6c]/25"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? "Verifying..." : "Verify OTP →"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3 – New Password ── */}
          {step === 3 && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#535766] uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setServerError("");
                    }}
                    className={inp(!newPassword && serverError) + " pr-8"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9ea0a9] hover:text-[#3e4152] p-1"
                  >
                    <EyeIcon visible={showNew} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#535766] uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setServerError("");
                    }}
                    className={inp(!confirmPassword && serverError) + " pr-8"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9ea0a9] hover:text-[#3e4152] p-1"
                  >
                    <EyeIcon visible={showConfirm} />
                  </button>
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <p
                    className={`text-xs mt-1.5 font-semibold ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}
                  >
                    {newPassword === confirmPassword
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-[#d4d5d9] text-[#3e4152] font-bold text-sm py-3 rounded-lg hover:border-[#3e4152] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#ff3f6c] hover:bg-[#e8365d] text-white font-extrabold text-sm py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#ff3f6c]/25"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-[#535766]">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-[#ff3f6c] font-bold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
