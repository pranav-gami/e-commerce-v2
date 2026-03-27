import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LocationDropdowns, {
  validatePhone,
} from "../components/LocationDropdowns";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// ─── helpers ────────────────────────────────────────────────────────────────

const inputClass = (hasErr) =>
  `w-full border ${hasErr ? "border-red-400 bg-red-50" : "border-gray-300"} rounded px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors`;

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

const emptyForm = {
  label: "",
  fullName: "",
  address: "",
  isDefault: false,
};

const emptyLoc = {
  countryId: null,
  stateId: null,
  cityId: null,
  postalCode: "",
  phoneCode: "",
  phone: "",
};

// ─── component ──────────────────────────────────────────────────────────────

const CheckoutAddressPage = () => {
  const navigate = useNavigate();
  const {
    getCheckoutAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();
  const { cartItems, getCartTotal } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // "add" | "edit" | null
  const [mode, setMode] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [locationIds, setLocationIds] = useState(emptyLoc);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "ADDRESS";
  }, []);
  const subtotal = getCartTotal();
  const savings = cartItems.reduce(
    (acc, item) =>
      acc + ((item.price * (item.discount || 0)) / 100) * item.quantity,
    0,
  );

  const formatPrice = (p) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(p);

  // ── fetch ─────────────────────────────────────────────────────────────────

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await getCheckoutAddresses();
      setAddresses(data.addresses || []);
      if (data.defaultAddressId) setSelectedId(data.defaultAddressId);
      else if (data.addresses?.length > 0) setSelectedId(data.addresses[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ── form helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    setForm(emptyForm);
    setLocationIds(emptyLoc);
    setErrors({});
    setServerError("");
  };

  const openEdit = (addr) => {
    setMode("edit");
    setEditingId(addr.id);

    const parsed = parsePhoneNumberFromString(addr.phone || "");

    setForm({
      label: addr.label || "",
      fullName: addr.fullName,
      address: addr.address,
      isDefault: addr.isDefault,
    });

    setLocationIds({
      countryId: addr.country?.id || null,
      stateId: addr.state?.id || null,
      cityId: addr.city?.id || null,
      postalCode: addr.postalCode || "",
      phoneCode: parsed ? `+${parsed.countryCallingCode}` : "+91",
      phone: parsed ? parsed.nationalNumber : "",
    });

    setErrors({});
    setServerError("");
  };

  const closeForm = () => {
    setMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setLocationIds(emptyLoc);
    setErrors({});
    setServerError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.fullName?.trim()) errs.fullName = "Full name is required";
    if (!form.address?.trim() || form.address.trim().length < 5)
      errs.address = "Address must be at least 5 characters";
    if (!locationIds.countryId) errs.countryId = "Country is required";
    if (!locationIds.stateId) errs.stateId = "State is required";
    if (!locationIds.cityId) errs.cityId = "City is required";
    if (!locationIds.postalCode?.trim())
      errs.postalCode = "Postal code is required";
    const phoneErr = validatePhone(locationIds.phoneCode, locationIds.phone);
    if (phoneErr) errs.phone = phoneErr;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setSubmitting(true);
      setServerError("");
      const fullPhone = `${locationIds.phoneCode}${locationIds.phone}`;
      const payload = {
        label: form.label || undefined,
        fullName: form.fullName,
        phone: fullPhone,
        address: form.address,
        postalCode: locationIds.postalCode,
        countryId: locationIds.countryId,
        stateId: locationIds.stateId,
        cityId: locationIds.cityId,
        isDefault: form.isDefault,
      };

      if (mode === "add") {
        const res = await addAddress(payload);
        await fetchAddresses();
        setSelectedId(res.address.id);
      } else {
        await updateAddress(editingId, payload);
        await fetchAddresses();
        setSelectedId(editingId);
      }
      closeForm();
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      await fetchAddresses();
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete this address");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      await fetchAddresses();
      setSelectedId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinue = () => {
    if (!selectedId) return;
    navigate("/checkout/payment", { state: { addressId: selectedId } });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top stepper bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Empty left spacer */}
          <div className="w-28" />

          {/* Steps — center */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Link
              to="/cart"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              BAG
            </Link>
            <span className="text-gray-300">──────</span>
            <span className="text-primary border-b-2 border-primary pb-0.5">
              ADDRESS
            </span>
            <span className="text-gray-300">──────</span>
            <span className="text-gray-400">PAYMENT</span>
          </div>

          {/* Secure badge — right */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 w-28 justify-end">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            100% SECURE
          </div>
        </div>
      </div>
      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* ── LEFT: Address list + form ── */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-extrabold text-gray-800">
              Select Delivery Address
            </h1>
            {mode === null && (
              <button
                onClick={openAdd}
                className="border border-gray-400 text-gray-700 text-xs font-extrabold uppercase tracking-wider px-4 py-2 hover:border-primary hover:text-primary transition-colors"
              >
                + ADD NEW ADDRESS
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Add / Edit form (inline, above list) ── */}
              {mode !== null && (
                <div className="border border-primary bg-white rounded mb-4 overflow-hidden">
                  <div className="bg-primary/5 border-b border-primary/20 px-5 py-3 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">
                      {mode === "add" ? "Add New Address" : "Edit Address"}
                    </h2>
                    <button
                      onClick={closeForm}
                      className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="p-5">
                    {serverError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded mb-4">
                        {serverError}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Recipient's full name"
                            value={form.fullName}
                            onChange={(e) => {
                              setForm((f) => ({
                                ...f,
                                fullName: e.target.value,
                              }));
                              setErrors((p) => ({ ...p, fullName: "" }));
                            }}
                            className={inputClass(errors.fullName)}
                          />
                          <FieldError msg={errors.fullName} />
                        </div>

                        {/* Label */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Label (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Home, Office"
                            value={form.label}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, label: e.target.value }))
                            }
                            className={inputClass(false)}
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Address *
                        </label>
                        <input
                          type="text"
                          placeholder="House/Flat, Street, Area, Landmark"
                          value={form.address}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, address: e.target.value }));
                            setErrors((p) => ({ ...p, address: "" }));
                          }}
                          className={inputClass(errors.address)}
                        />
                        <FieldError msg={errors.address} />
                      </div>

                      {/* Location dropdowns */}
                      <LocationDropdowns
                        value={locationIds}
                        onChange={(loc) => {
                          setLocationIds(loc);
                          setErrors((p) => ({
                            ...p,
                            countryId: "",
                            stateId: "",
                            cityId: "",
                            postalCode: "",
                            phone: "",
                          }));
                        }}
                        errors={errors}
                        showPhone={true}
                      />

                      {/* Default checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isDefault}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              isDefault: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-pink-500"
                        />
                        <span className="text-sm text-gray-700 font-semibold">
                          Set as default address
                        </span>
                      </label>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={closeForm}
                          className="flex-1 border border-gray-300 text-gray-600 font-bold text-sm py-2.5 rounded hover:border-gray-400 transition-colors"
                        >
                          CANCEL
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 bg-primary text-white font-extrabold text-sm py-2.5 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                              SAVING...
                            </>
                          ) : mode === "add" ? (
                            "SAVE ADDRESS"
                          ) : (
                            "UPDATE ADDRESS"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── Saved addresses ── */}
              {addresses.length > 0 && (
                <>
                  {/* Default label above first address */}
                  {addresses.some((a) => a.isDefault) && (
                    <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                      Default Address
                    </p>
                  )}

                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          if (mode === null) setSelectedId(addr.id);
                        }}
                        className={`bg-white border rounded p-4 transition-all ${
                          mode === null ? "cursor-pointer" : "cursor-default"
                        } ${
                          selectedId === addr.id && mode === null
                            ? "border-primary"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Radio */}
                          {mode === null && (
                            <div
                              className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                selectedId === addr.id
                                  ? "border-primary"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedId === addr.id && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                          )}

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-gray-800">
                                {addr.fullName}
                              </span>
                              {addr.label && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-300 px-2 py-0.5 rounded">
                                  {addr.label}
                                </span>
                              )}
                              {addr.isDefault && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                              {addr.address}, {addr.city?.name},{" "}
                              {addr.state?.name} – {addr.postalCode}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {addr.country?.name}
                            </p>
                            <p className="text-sm text-gray-700 font-semibold mt-1">
                              Mobile: {addr.phone}
                            </p>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(addr.id);
                                }}
                                className="border border-gray-400 text-gray-600 text-xs font-extrabold uppercase px-3 py-1.5 hover:border-red-400 hover:text-red-500 transition-colors"
                              >
                                REMOVE
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(addr);
                                }}
                                className="border border-gray-400 text-gray-600 text-xs font-extrabold uppercase px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
                              >
                                EDIT
                              </button>
                              {!addr.isDefault && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetDefault(addr.id);
                                  }}
                                  className="text-xs text-primary font-bold hover:underline ml-1"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Add New Address link (when no form open) ── */}
              {mode === null && (
                <button
                  onClick={openAdd}
                  className="mt-4 w-full flex items-center gap-2 text-sm font-bold text-primary border border-dashed border-gray-300 p-4 hover:border-primary hover:bg-pink-50 transition-all rounded"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New Address
                </button>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Price summary ── */}
        <div className="w-full lg:w-80 flex-shrink-0 sticky top-20">
          <div className="bg-white border border-gray-200 rounded">
            {/* Delivery estimates */}
            {cartItems.length > 0 && (
              <div className="border-b border-gray-100 p-4">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">
                  Delivery Estimates
                </p>
                <div className="space-y-2">
                  {cartItems.slice(0, 4).map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-12 flex-shrink-0 bg-gray-50 border border-gray-100 rounded overflow-hidden">
                        <img
                          src={item.image || "/placeholder.png"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Estimated delivery by{" "}
                        <span className="font-bold text-gray-800">
                          {new Date(
                            Date.now() + 4 * 24 * 60 * 60 * 1000,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price details */}
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">
                Price Details ({cartItems.length}{" "}
                {cartItems.length === 1 ? "Item" : "Items"})
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Total MRP</span>
                  <span>{formatPrice(subtotal + savings)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-primary font-semibold">
                    <span>Discount on MRP</span>
                    <span>− {formatPrice(savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Platform Fee</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between font-extrabold text-gray-800 text-base">
                <span>Total Amount</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            {/* Continue button */}
            <div className="p-4">
              <button
                onClick={handleContinue}
                disabled={!selectedId || mode !== null}
                className="w-full bg-primary text-white font-extrabold text-sm py-4 hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
              >
                CONTINUE
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutAddressPage;
