import { useState, useEffect } from "react";
import LocationDropdowns, { validatePhone } from "./LocationDropdowns";
import { useAppDispatch } from "../redux/hooks";
import {
  getCheckoutAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
} from "../redux/slices/authSlice";

const inputClass = (hasErr) =>
  `w-full border ${hasErr ? "border-red-400 bg-red-50" : "border-brand-border"} rounded px-4 py-3 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors`;

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

const emptyForm = {
  label: "",
  fullName: "",
  phone: "",
  address: "",
  postalCode: "",
  countryId: null,
  stateId: null,
  cityId: null,
  isDefault: false,
};

const emptyLocation = {
  countryId: null,
  stateId: null,
  cityId: null,
  postalCode: "",
  phoneCode: "",
  phone: "",
};

const AddressSelector = ({ onConfirm, onClose }) => {
  const dispatch = useAppDispatch();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [locationIds, setLocationIds] = useState(emptyLocation);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await getCheckoutAddresses();
      const list = data.addresses || [];
      setAddresses(list);
      if (data.defaultAddressId) setSelectedId(data.defaultAddressId);
      else if (list.length > 0) setSelectedId(list[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (loc) => {
    setLocationIds(loc);
    setErrors((prev) => ({
      ...prev,
      countryId: "",
      stateId: "",
      cityId: "",
      postalCode: "",
      phone: "",
    }));
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

  const handleAddSubmit = async (e) => {
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
      const result = await addAddress({
        label: form.label || undefined,
        fullName: form.fullName,
        phone: fullPhone,
        address: form.address,
        postalCode: locationIds.postalCode,
        countryId: locationIds.countryId,
        stateId: locationIds.stateId,
        cityId: locationIds.cityId,
        isDefault: form.isDefault,
      });
      const newAddr = result.address;
      await fetchAddresses();
      setSelectedId(newAddr.id);
      setShowAddForm(false);
      setForm(emptyForm);
      setLocationIds(emptyLocation);
      setErrors({});
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to add address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteAddress(id);
      await fetchAddresses();
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete this address");
    }
  };

  const handleSetDefault = async (e, id) => {
    e.stopPropagation();
    try {
      await setDefaultAddress(id);
      await fetchAddresses();
      setSelectedId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm(selectedId);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-lg bg-white rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-light flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold text-brand-dark">
              Select Delivery Address
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-border transition-colors text-brand-gray hover:text-brand-dark"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedId(addr.id)}
                      className={`relative border rounded p-4 cursor-pointer transition-all ${
                        selectedId === addr.id
                          ? "border-primary bg-primary/5"
                          : "border-brand-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            selectedId === addr.id ? "border-primary" : "border-brand-border"
                          }`}
                        >
                          {selectedId === addr.id && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-brand-dark">
                              {addr.fullName}
                            </span>
                            {addr.label && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-light text-primary px-2 py-0.5 rounded-full">
                                {addr.label}
                              </span>
                            )}
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-brand-gray mt-1 leading-relaxed">
                            {addr.address}, {addr.city?.name}, {addr.state?.name} – {addr.postalCode}
                          </p>
                          <p className="text-xs text-brand-gray mt-0.5">{addr.country?.name}</p>
                          <p className="text-xs text-brand-dark font-semibold mt-1">
                            Mobile: {addr.phone}
                          </p>

                          <div className="flex items-center gap-3 mt-2">
                            {!addr.isDefault && (
                              <button
                                onClick={(e) => handleSetDefault(e, addr.id)}
                                className="text-xs text-primary font-bold hover:underline"
                              >
                                Set as Default
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, addr.id)}
                              className="text-xs text-red-400 font-bold hover:text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center gap-2 border border-dashed border-brand-border rounded p-4 text-sm font-bold text-primary hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New Address
                </button>
              ) : (
                <div className="border border-brand-border rounded p-4 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-brand-dark uppercase tracking-wider">
                      New Address
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setForm(emptyForm);
                        setLocationIds(emptyLocation);
                        setErrors({});
                      }}
                      className="text-xs text-brand-gray hover:text-brand-dark font-semibold"
                    >
                      Cancel
                    </button>
                  </div>

                  {serverError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded mb-4">
                      {serverError}
                    </div>
                  )}

                  <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                        Label (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Home, Office"
                        value={form.label}
                        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                        className={inputClass(false)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Recipient's full name"
                        value={form.fullName}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, fullName: e.target.value }));
                          setErrors((p) => ({ ...p, fullName: "" }));
                        }}
                        className={inputClass(errors.fullName)}
                      />
                      <FieldError msg={errors.fullName} />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
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

                    <LocationDropdowns
                      value={locationIds}
                      onChange={handleLocationChange}
                      errors={errors}
                      showPhone={true}
                    />

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm text-brand-dark font-semibold">
                        Set as default address
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary text-white font-extrabold text-sm py-3 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          SAVING...
                        </>
                      ) : (
                        "SAVE ADDRESS"
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {!showAddForm && (
          <div className="flex-shrink-0 border-t border-brand-border p-4 bg-white">
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              DELIVER HERE
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AddressSelector;