import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { signupStep1Schema, validate } from "../utils/validate";
import LocationDropdowns, {
  validatePhone,
} from "../components/LocationDropdowns";

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

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const otpRefs = useRef([]);

  const [form1, setForm1] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors1, setErrors1] = useState({});

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

  useEffect(() => {
    document.title = "Myntra";
  }, []);

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
        locationIds.postalCode,
      );
      setSuccessMessage("🎉 Account created successfully! Please login.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed.");
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

  const FieldError = ({ msg }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

  const inputClass = (hasErr) =>
    `w-full border ${hasErr ? "border-red-400 bg-red-50" : "border-brand-border"} rounded px-4 py-3 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors`;

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-white border border-brand-border rounded shadow-sm overflow-hidden">
          <div className="h-1 bg-primary w-full" />
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <Link to="/">
                <span className="text-3xl font-extrabold text-primary">
                  Shop
                </span>
                <span className="text-3xl font-extrabold text-brand-dark">
                  .in
                </span>
              </Link>
              <h1 className="text-xl font-extrabold text-brand-dark mt-3">
                Create Account
              </h1>
              <p className="text-sm text-brand-gray mt-1">
                Join us today! It's free.
              </p>

              {/* Step indicators */}
              <div className="flex items-center justify-center mt-5 gap-0">
                {[
                  { n: 1, label: "Account" },
                  { n: 2, label: "Verify" },
                  { n: 3, label: "Address" },
                ].map((s, i) => (
                  <div key={s.n} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${step >= s.n ? "bg-primary text-white" : "bg-brand-border text-brand-gray"}`}
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
                        className={`text-[10px] font-bold mt-1 ${step >= s.n ? "text-primary" : "text-brand-gray"}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className={`w-12 h-0.5 -mt-4 mx-1 ${step > s.n ? "bg-primary" : "bg-brand-border"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded mb-5 font-medium">
                {serverError}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded mb-5 font-medium">
                {successMessage}
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={form1.name}
                    onChange={handleChange1}
                    className={inputClass(errors1.name)}
                  />
                  <FieldError msg={errors1.name} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={form1.email}
                    onChange={handleChange1}
                    className={inputClass(errors1.email)}
                  />
                  <FieldError msg={errors1.email} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Min 6 chars, 1 uppercase, 1 number"
                        value={form1.password}
                        onChange={handleChange1}
                        className={inputClass(errors1.password) + " pr-12"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-dark"
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    </div>
                    <FieldError msg={errors1.password} />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Repeat password"
                        value={form1.confirmPassword}
                        onChange={handleChange1}
                        className={
                          inputClass(errors1.confirmPassword) + " pr-12"
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-dark"
                      >
                        <EyeIcon visible={showConfirmPassword} />
                      </button>
                    </div>
                    <FieldError msg={errors1.confirmPassword} />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-extrabold text-sm py-3.5 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 tracking-wider flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      SENDING OTP...
                    </>
                  ) : (
                    "CONTINUE →"
                  )}
                </button>
              </form>
            )}

            {/* Step 2 - OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-brand-light rounded border border-brand-border">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      width="20"
                      height="20"
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
                    <p className="text-sm font-bold text-brand-dark">
                      Check your email
                    </p>
                    <p className="text-xs text-brand-gray mt-0.5">
                      We sent a 6-digit OTP to{" "}
                      <strong>{step1Data?.email}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-3">
                    Enter OTP *
                  </label>
                  <div className="flex gap-2.5 justify-center">
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
                        className="w-11 h-13 text-center text-xl font-extrabold border-2 border-brand-border rounded focus:outline-none focus:border-primary transition-colors caret-transparent"
                        style={{ height: "3.25rem" }}
                      />
                    ))}
                  </div>
                  <FieldError msg={otpError} />
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span
                      className={`font-semibold ${timer <= 60 ? "text-red-500" : "text-brand-gray"}`}
                    >
                      {timer > 0
                        ? `⏱ Expires in ${formatTime(timer)}`
                        : "OTP expired"}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={timer > 0 || resendLoading}
                      className="text-primary font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resendLoading ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(["", "", "", "", "", ""]);
                      setOtpError("");
                    }}
                    className="flex-1 border border-brand-border text-brand-dark font-bold text-sm py-3 rounded hover:bg-brand-light transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || timer <= 0}
                    className="flex-1 bg-primary text-white font-extrabold text-sm py-3 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {loading ? "VERIFYING..." : "VERIFY →"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    placeholder="House/Flat, Street, Area"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setAddressError("");
                    }}
                    className={inputClass(addressError)}
                  />
                  <FieldError msg={addressError} />
                </div>

                <LocationDropdowns
                  value={locationIds}
                  onChange={setLocationIds}
                  errors={locationErrors}
                  showPhone={true}
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 border border-brand-border text-brand-dark font-bold text-sm py-3 rounded hover:bg-brand-light transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-white font-extrabold text-sm py-3 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {loading ? "CREATING..." : "CREATE ACCOUNT"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-brand-gray">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-bold hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
