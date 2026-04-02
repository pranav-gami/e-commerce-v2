import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, validate } from "../utils/validate";
import { login } from "../redux/slices/authSlice";
import { fetchCart } from "../redux/slices/cartSlice";
import { useAppDispatch } from "../redux/hooks";
import { FiTruck, FiRefreshCw, FiShield } from "react-icons/fi";
const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Myntra";
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(loginSchema, form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      setLoading(true);
      await dispatch(
        login({ email: form.email, password: form.password }),
      ).unwrap();
      await dispatch(fetchCart());
      navigate("/");
    } catch (err) {
      setServerError(
        typeof err === "string"
          ? err
          : err?.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – decorative brand side */}

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

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 bg-white">
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
            Welcome back
          </h1>
          <p className="text-sm text-[#535766] mb-7">
            Login to your Myntra account
          </p>

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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#535766] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className={`w-full border-b-2 ${
                  errors.email ? "border-red-400" : "border-[#d4d5d9]"
                } bg-transparent px-0 py-2.5 text-sm text-[#3e4152] placeholder-[#9ea0a9] focus:outline-none focus:border-[#ff3f6c] transition-colors`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#535766] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#ff3f6c] font-semibold hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full border-b-2 ${
                    errors.password ? "border-red-400" : "border-[#d4d5d9]"
                  } bg-transparent px-0 py-2.5 pr-10 text-sm text-[#3e4152] placeholder-[#9ea0a9] focus:outline-none focus:border-[#ff3f6c] transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9ea0a9] hover:text-[#3e4152] transition-colors p-1"
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
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* T&C note */}
            <p className="text-[11px] text-[#9ea0a9] leading-relaxed">
              By continuing, I agree to Myntra's{" "}
              <Link to="/terms" className="text-[#3e4152] underline">
                Terms of Use
              </Link>{" "}
              &{" "}
              <Link to="/privacy" className="text-[#3e4152] underline">
                Privacy Policy
              </Link>
              .
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff3f6c] hover:bg-[#e8365d] active:bg-[#d42f55] text-white font-extrabold text-sm py-4 rounded-lg transition-colors disabled:opacity-60 tracking-widest uppercase flex items-center justify-center gap-2 shadow-md shadow-[#ff3f6c]/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#eaeaec]" />
            <span className="text-xs text-[#9ea0a9] font-medium">OR</span>
            <div className="flex-1 h-px bg-[#eaeaec]" />
          </div>

          {/* Create account */}
          <Link
            to="/signup"
            className="block w-full border-2 border-[#ff3f6c] text-[#ff3f6c] font-extrabold text-sm py-3.5 rounded-lg text-center hover:bg-[#fff0f3] transition-colors tracking-widest uppercase"
          >
            Create New Account
          </Link>

          <p className="text-center text-xs text-[#9ea0a9] mt-6">
            Having trouble logging in?{" "}
            <Link
              to="/contact"
              className="text-[#ff3f6c] font-semibold hover:underline"
            >
              Get Help
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
