import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { loginSchema, validate } from "../utils/validate";

const LoginPage = () => {
  const { login } = useAuth();
  const { fetchCart } = useCart();
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
      await login(form.email, form.password);
      await fetchCart();
      navigate("/");
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-brand-border rounded shadow-sm overflow-hidden">
          {/* Left stripe accent */}
          <div className="h-1 bg-primary w-full" />

          <div className="p-8">
            {/* Logo */}
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
                Welcome Back
              </h1>
              <p className="text-sm text-brand-gray mt-1">
                Please sign in to your account
              </p>
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded mb-5 font-medium">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full border ${errors.email ? "border-red-400 bg-red-50" : "border-brand-border"} rounded px-4 py-3 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-brand-gray uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full border ${errors.password ? "border-red-400 bg-red-50" : "border-brand-border"} rounded px-4 py-3 pr-12 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-dark transition-colors"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-extrabold text-sm py-3.5 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    SIGNING IN...
                  </>
                ) : (
                  "SIGN IN"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-brand-gray">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary font-bold hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-brand-gray">
          {["100% Secure", "No Spam", "Easy Returns"].map((t) => (
            <span key={t} className="flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff3f6c"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
