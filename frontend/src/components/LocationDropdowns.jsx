import { useState, useEffect } from "react";
import axios from "axios";
import { isValidPhoneNumber } from "libphonenumber-js";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const LOCATION_BASE = `${BACKEND_URL}/users/location`;

export const useCountries = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${LOCATION_BASE}/countries`);
        setCountries(res.data.data || []);
      } catch (err) {
        console.error("Failed to load countries", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);
  return { countries, loading };
};

export const validatePhone = (phoneCode, phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim().length === 0) return "Phone number is required";
  const fullPhone = `${phoneCode}${phoneNumber}`;
  try {
    if (!isValidPhoneNumber(fullPhone)) return "Enter a valid phone number for the selected country";
  } catch {
    return "Enter a valid phone number";
  }
  return "";
};

const selectClass = (hasErr) =>
  `w-full border ${hasErr ? "border-red-400 bg-red-50" : "border-brand-border"} rounded px-4 py-3 text-sm text-brand-dark bg-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;

const inputClass = (hasErr) =>
  `w-full border ${hasErr ? "border-red-400 bg-red-50" : "border-brand-border"} rounded px-4 py-3 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors disabled:opacity-50`;

const Label = ({ children }) => (
  <label className="block text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

const LocationDropdowns = ({ value, onChange, errors = {}, showPhone = false }) => {
  const { countries, loading: countriesLoading } = useCountries();

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [postalCodes, setPostalCodes] = useState([]);
  const [cityName, setCityName] = useState("");

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPostal, setLoadingPostal] = useState(false);

  const selectedCountry = countries.find((c) => c.id === value.countryId);
  const isIndia = selectedCountry?.isoCode === "IN";

  useEffect(() => {
    if (!value.countryId) { setStates([]); setCities([]); setPostalCodes([]); setCityName(""); return; }
    const fetch = async () => {
      setLoadingStates(true);
      try {
        const res = await axios.get(`${LOCATION_BASE}/states/${value.countryId}`);
        setStates(res.data.data || []);
        setCities([]); setPostalCodes([]); setCityName("");
      } catch (err) { console.error("Failed to load states", err); }
      finally { setLoadingStates(false); }
    };
    fetch();
  }, [value.countryId]);

  useEffect(() => {
    if (!value.stateId) { setCities([]); setPostalCodes([]); setCityName(""); return; }
    const fetch = async () => {
      setLoadingCities(true);
      try {
        const res = await axios.get(`${LOCATION_BASE}/cities/${value.stateId}`);
        setCities(res.data.data || []);
        setPostalCodes([]); setCityName("");
      } catch (err) { console.error("Failed to load cities", err); }
      finally { setLoadingCities(false); }
    };
    fetch();
  }, [value.stateId]);

  useEffect(() => {
    if (!value.cityId || !cityName || !isIndia) { setPostalCodes([]); return; }
    const fetch = async () => {
      setLoadingPostal(true);
      try {
        const res = await axios.get(`https://api.postalpincode.in/postoffice/${encodeURIComponent(cityName)}`);
        const data = res.data?.[0];
        if (data?.Status === "Success" && Array.isArray(data.PostOffice)) {
          const pins = [...new Set(data.PostOffice.map((p) => p.Pincode))];
          setPostalCodes(pins);
        } else { setPostalCodes([]); }
      } catch (err) { console.error("Failed to load postal codes", err); setPostalCodes([]); }
      finally { setLoadingPostal(false); }
    };
    fetch();
  }, [value.cityId, cityName, isIndia]);

  const handleChange = (field, id) => {
    const numId = id ? Number(id) : null;
    if (field === "countryId") {
      const selected = countries.find((c) => c.id === numId);
      onChange({ ...value, countryId: numId, phoneCode: selected?.phoneCode ?? "", stateId: null, cityId: null, postalCode: "", phone: "" });
      setCityName("");
    } else if (field === "stateId") {
      onChange({ ...value, stateId: numId, cityId: null, postalCode: "" });
      setCityName("");
    } else if (field === "cityId") {
      const selected = cities.find((c) => c.id === numId);
      setCityName(selected?.name || "");
      onChange({ ...value, cityId: numId, postalCode: "" });
    } else {
      onChange({ ...value, [field]: numId });
    }
  };

  return (
    <div className="space-y-4">
      {/* Country */}
      <div>
        <Label>Country *</Label>
        <select
          value={value.countryId || ""}
          onChange={(e) => handleChange("countryId", e.target.value)}
          disabled={countriesLoading}
          className={selectClass(errors.countryId)}
        >
          <option value="">{countriesLoading ? "Loading countries..." : "Select Country"}</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <FieldError msg={errors.countryId} />
      </div>

      {/* Phone (after country) */}
      {showPhone && value.countryId && (
        <div>
          <Label>Phone *</Label>
          <div className="flex gap-2">
            <select
              value={value.phoneCode || ""}
              onChange={(e) => onChange({ ...value, phoneCode: e.target.value, phone: "" })}
              className={`w-24 flex-shrink-0 border ${errors.phone ? "border-red-400 bg-red-50" : "border-brand-border"} rounded px-2 py-3 text-sm text-brand-dark bg-white focus:outline-none focus:border-primary transition-colors`}
            >
              <option value="">+</option>
              {countries.map((c) => <option key={c.id} value={c.phoneCode}>{c.phoneCode}</option>)}
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              value={value.phone || ""}
              onChange={(e) => { const digits = e.target.value.replace(/\D/g, ""); onChange({ ...value, phone: digits }); }}
              className={`flex-1 ${inputClass(errors.phone)}`}
            />
          </div>
          <FieldError msg={errors.phone} />
        </div>
      )}

      {/* State */}
      <div>
        <Label>State *</Label>
        <select
          value={value.stateId || ""}
          onChange={(e) => handleChange("stateId", e.target.value)}
          disabled={!value.countryId || loadingStates}
          className={selectClass(errors.stateId)}
        >
          <option value="">
            {!value.countryId ? "Select country first" : loadingStates ? "Loading states..." : "Select State"}
          </option>
          {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <FieldError msg={errors.stateId} />
      </div>

      {/* City */}
      <div>
        <Label>City *</Label>
        <select
          value={value.cityId || ""}
          onChange={(e) => handleChange("cityId", e.target.value)}
          disabled={!value.stateId || loadingCities}
          className={selectClass(errors.cityId)}
        >
          <option value="">
            {!value.stateId ? "Select state first" : loadingCities ? "Loading cities..." : "Select City"}
          </option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <FieldError msg={errors.cityId} />
      </div>

      {/* Postal Code */}
      <div>
        <Label>Postal Code *</Label>
        {isIndia && value.cityId ? (
          loadingPostal ? (
            <div className="flex items-center gap-2 border border-brand-border rounded px-4 py-3 text-sm text-brand-gray">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading postal codes...
            </div>
          ) : postalCodes.length > 0 ? (
            <select
              value={value.postalCode || ""}
              onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
              className={selectClass(errors.postalCode)}
            >
              <option value="">Select Postal Code</option>
              {postalCodes.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Enter postal code manually"
              value={value.postalCode || ""}
              maxLength={10}
              onChange={(e) => onChange({ ...value, postalCode: e.target.value.replace(/\D/g, "") })}
              className={inputClass(errors.postalCode)}
            />
          )
        ) : (
          <input
            type="text"
            placeholder={!value.cityId ? "Select city first" : "Enter postal code"}
            value={value.postalCode || ""}
            maxLength={10}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            disabled={!value.cityId}
            className={inputClass(errors.postalCode)}
          />
        )}
        <FieldError msg={errors.postalCode} />
      </div>
    </div>
  );
};

export default LocationDropdowns;