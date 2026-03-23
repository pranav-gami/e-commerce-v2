// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LocationDropdowns from "../components/LocationDropdowns";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({ name: "", address: "" });
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
    if (user) {
      // Split stored phone into code + number
      const storedPhone = user.phone || "";
      let phoneCode = user.country?.phoneCode || "";
      let phoneNumber = storedPhone;
      if (phoneCode && storedPhone.startsWith(phoneCode)) {
        phoneNumber = storedPhone.slice(phoneCode.length);
      }

      setForm({ name: user.name || "", address: user.address || "" });
      setLocationIds({
        countryId: user.country?.id ?? null,
        stateId: user.state?.id ?? null,
        cityId: user.city?.id ?? null,
        postalCode: user.postalCode ?? "",
        phoneCode,
        phone: phoneNumber,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!locationIds.countryId) errs.countryId = "Country is required";
    if (!locationIds.stateId) errs.stateId = "State is required";
    if (!locationIds.cityId) errs.cityId = "City is required";
    if (!locationIds.postalCode || locationIds.postalCode.trim().length < 3)
      errs.postalCode = "Enter a valid postal code";
    if (!locationIds.phone || locationIds.phone.trim().length < 6)
      errs.phone = "Enter a valid phone number";
    if (Object.keys(errs).length > 0) {
      setLocationErrors(errs);
      return;
    }

    try {
      setLoading(true);
      setServerError("");
      setLocationErrors({});
      const fullPhone = `${locationIds.phoneCode}${locationIds.phone}`;
      await updateProfile({
        name: form.name,
        phone: fullPhone,
        address: form.address,
        countryId: locationIds.countryId,
        stateId: locationIds.stateId,
        cityId: locationIds.cityId,
        postalCode: locationIds.postalCode,
      });
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setServerError("");
    setLocationErrors({});
    if (user) {
      const storedPhone = user.phone || "";
      let phoneCode = user.country?.phoneCode || "";
      let phoneNumber = storedPhone;
      if (phoneCode && storedPhone.startsWith(phoneCode)) {
        phoneNumber = storedPhone.slice(phoneCode.length);
      }
      setForm({ name: user.name || "", address: user.address || "" });
      setLocationIds({
        countryId: user.country?.id ?? null,
        stateId: user.state?.id ?? null,
        cityId: user.city?.id ?? null,
        postalCode: user.postalCode ?? "",
        phoneCode,
        phone: phoneNumber,
      });
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header-card">
          <div className="profile-avatar-large">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-header-info">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <span className="profile-role-badge">{user?.role}</span>
          </div>
          {!isEditing && (
            <button
              className="btn btn-primary btn-sm profile-edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="2" x2="22" y2="6" />
                  <path d="M7.5 20.5L2 22l1.5-5.5L16 4l4 4L7.5 20.5z" />
                </svg>
              </span>
              Edit Profile
            </button>
          )}
        </div>

        {serverError && <div className="auth-error">{serverError}</div>}
        {successMessage && <div className="auth-success">{successMessage}</div>}

        <div className="profile-details-card">
          <h3 className="profile-section-title">Personal Information</h3>

          {!isEditing ? (
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Full Name</span>
                <span className="profile-info-value">{user?.name || "-"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{user?.email || "-"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Phone</span>
                <span className="profile-info-value">{user?.phone || "-"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Address</span>
                <span className="profile-info-value">
                  {user?.address || "-"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Country</span>
                <span className="profile-info-value">
                  {user?.country?.name || "-"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">State</span>
                <span className="profile-info-value">
                  {user?.state?.name || "-"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">City</span>
                <span className="profile-info-value">
                  {user?.city?.name || "-"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Postal Code</span>
                <span className="profile-info-value">
                  {user?.postalCode || "-"}
                </span>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="House/Flat, Street, Area"
                />
              </div>

              {/* Country → Phone (after country) → State → City → Postal */}
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
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary auth-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
