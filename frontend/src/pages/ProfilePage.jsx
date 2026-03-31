import { useState, useEffect } from "react";
import LocationDropdowns from "../components/LocationDropdowns";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { selectUser, updateProfile } from "../redux/slices/authSlice";

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

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
    document.title = "Profile";
  }, []);

  useEffect(() => {
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
      await dispatch(
        updateProfile({
          name: form.name,
          phone: fullPhone,
          address: form.address,
          countryId: locationIds.countryId,
          stateId: locationIds.stateId,
          cityId: locationIds.cityId,
          postalCode: locationIds.postalCode,
        }),
      );
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
      if (phoneCode && storedPhone.startsWith(phoneCode))
        phoneNumber = storedPhone.slice(phoneCode.length);
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

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3.5 border-b border-brand-border last:border-0">
      <span className="text-xs font-extrabold text-brand-gray uppercase tracking-wider w-36 flex-shrink-0 mb-1 sm:mb-0">
        {label}
      </span>
      <span className="text-sm text-brand-dark font-medium">
        {value || "—"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-light py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Profile header card */}
        <div className="bg-white border border-brand-border rounded shadow-sm overflow-hidden">
          <div className="h-1 bg-primary" />
          <div className="p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-brand-dark truncate">
                {user?.name}
              </h2>
              <p className="text-sm text-brand-gray truncate">{user?.email}</p>
              <span className="inline-block mt-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-primary-light text-primary px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-shrink-0 flex items-center gap-2 border border-primary text-primary text-xs font-extrabold px-4 py-2 rounded hover:bg-primary hover:text-white transition-all tracking-wider"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="2" x2="22" y2="6" />
                  <path d="M7.5 20.5L2 22l1.5-5.5L16 4l4 4L7.5 20.5z" />
                </svg>
                EDIT
              </button>
            )}
          </div>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded font-medium">
            {serverError}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded font-medium flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Details card */}
        <div className="bg-white border border-brand-border rounded shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border">
            <h3 className="text-xs font-extrabold text-brand-gray uppercase tracking-wider">
              Personal Information
            </h3>
          </div>

          {!isEditing ? (
            <div className="px-6 py-2">
              <InfoRow label="Full Name" value={user?.name} />
              <InfoRow label="Email" value={user?.email} />
              <InfoRow label="Phone" value={user?.phone} />
              <InfoRow label="Address" value={user?.address} />
              <InfoRow label="Country" value={user?.country?.name} />
              <InfoRow label="State" value={user?.state?.name} />
              <InfoRow label="City" value={user?.city?.name} />
              <InfoRow label="Postal Code" value={user?.postalCode} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="w-full border border-brand-border rounded px-4 py-3 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="House/Flat, Street, Area"
                  className="w-full border border-brand-border rounded px-4 py-3 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <LocationDropdowns
                value={locationIds}
                onChange={setLocationIds}
                errors={locationErrors}
                showPhone={true}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 border border-brand-border text-brand-dark font-extrabold text-sm py-3 rounded hover:bg-brand-light transition-colors tracking-wider"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white font-extrabold text-sm py-3 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 tracking-wider flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      SAVING...
                    </>
                  ) : (
                    "SAVE CHANGES"
                  )}
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
