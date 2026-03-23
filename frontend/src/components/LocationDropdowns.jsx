// src/components/LocationDropdowns.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { isValidPhoneNumber } from "libphonenumber-js";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const LOCATION_BASE = `${BACKEND_URL}/users/location`;

// ── Exported hook ──
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

// ── Phone validation ──
export const validatePhone = (phoneCode, phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return "Phone number is required";
  }
  const fullPhone = `${phoneCode}${phoneNumber}`;
  try {
    if (!isValidPhoneNumber(fullPhone)) {
      return "Enter a valid phone number for the selected country";
    }
  } catch {
    return "Enter a valid phone number";
  }
  return "";
};

// ── Main component ──
const LocationDropdowns = ({
  value,
  onChange,
  errors = {},
  showPhone = false,
}) => {
  const { countries, loading: countriesLoading } = useCountries();

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [postalCodes, setPostalCodes] = useState([]);
  const [cityName, setCityName] = useState("");

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPostal, setLoadingPostal] = useState(false);

  // ── Is selected country India? ──
  const selectedCountry = countries.find((c) => c.id === value.countryId);
  const isIndia = selectedCountry?.isoCode === "IN";

  // Load states when country changes
  useEffect(() => {
    if (!value.countryId) {
      setStates([]);
      setCities([]);
      setPostalCodes([]);
      setCityName("");
      return;
    }
    const fetch = async () => {
      setLoadingStates(true);
      try {
        const res = await axios.get(
          `${LOCATION_BASE}/states/${value.countryId}`,
        );
        setStates(res.data.data || []);
        setCities([]);
        setPostalCodes([]);
        setCityName("");
      } catch (err) {
        console.error("Failed to load states", err);
      } finally {
        setLoadingStates(false);
      }
    };
    fetch();
  }, [value.countryId]);

  // Load cities when state changes
  useEffect(() => {
    if (!value.stateId) {
      setCities([]);
      setPostalCodes([]);
      setCityName("");
      return;
    }
    const fetch = async () => {
      setLoadingCities(true);
      try {
        const res = await axios.get(`${LOCATION_BASE}/cities/${value.stateId}`);
        setCities(res.data.data || []);
        setPostalCodes([]);
        setCityName("");
      } catch (err) {
        console.error("Failed to load cities", err);
      } finally {
        setLoadingCities(false);
      }
    };
    fetch();
  }, [value.stateId]);

  // ── Fetch postal codes when city changes (India only) ──
  useEffect(() => {
    if (!value.cityId || !cityName || !isIndia) {
      setPostalCodes([]);
      return;
    }
    const fetch = async () => {
      setLoadingPostal(true);
      try {
        const res = await axios.get(
          `https://api.postalpincode.in/postoffice/${encodeURIComponent(cityName)}`,
        );
        const data = res.data?.[0];
        if (data?.Status === "Success" && Array.isArray(data.PostOffice)) {
          // Get unique pin codes
          const pins = [...new Set(data.PostOffice.map((p) => p.Pincode))];
          setPostalCodes(pins);
        } else {
          setPostalCodes([]);
        }
      } catch (err) {
        console.error("Failed to load postal codes", err);
        setPostalCodes([]);
      } finally {
        setLoadingPostal(false);
      }
    };
    fetch();
  }, [value.cityId, cityName, isIndia]);

  const handleChange = (field, id) => {
    const numId = id ? Number(id) : null;
    if (field === "countryId") {
      const selected = countries.find((c) => c.id === numId);
      onChange({
        ...value,
        countryId: numId,
        phoneCode: selected?.phoneCode ?? "",
        stateId: null,
        cityId: null,
        postalCode: "",
        phone: "",
      });
      setCityName("");
    } else if (field === "stateId") {
      onChange({ ...value, stateId: numId, cityId: null, postalCode: "" });
      setCityName("");
    } else if (field === "cityId") {
      // Also store city name for postal API
      const selected = cities.find((c) => c.id === numId);
      setCityName(selected?.name || "");
      onChange({ ...value, cityId: numId, postalCode: "" });
    } else {
      onChange({ ...value, [field]: numId });
    }
  };

  return (
    <>
      {/* ── Country ── */}
      <div className="form-group">
        <label>Country *</label>
        <select
          value={value.countryId || ""}
          onChange={(e) => handleChange("countryId", e.target.value)}
          className={errors.countryId ? "input-error" : ""}
          disabled={countriesLoading}
        >
          <option value="">
            {countriesLoading ? "Loading..." : "Select Country"}
          </option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.countryId && (
          <span className="field-error">{errors.countryId}</span>
        )}
      </div>

      {/* ── Phone after country ── */}
      {showPhone && value.countryId && (
        <div className="form-group">
          <label>Phone *</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select
              value={value.phoneCode || ""}
              onChange={(e) =>
                onChange({ ...value, phoneCode: e.target.value, phone: "" })
              }
              style={{ width: "90px", flexShrink: 0 }}
              className={errors.phone ? "input-error" : ""}
            >
              <option value="">+</option>
              {countries.map((c) => (
                <option key={c.id} value={c.phoneCode}>
                  {c.phoneCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              value={value.phone || ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                onChange({ ...value, phone: digits });
              }}
              className={errors.phone ? "input-error" : ""}
              style={{ flex: 1 }}
            />
          </div>
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>
      )}

      {/* ── State ── */}
      <div className="form-group">
        <label>State *</label>
        <select
          value={value.stateId || ""}
          onChange={(e) => handleChange("stateId", e.target.value)}
          className={errors.stateId ? "input-error" : ""}
          disabled={!value.countryId || loadingStates}
        >
          <option value="">
            {!value.countryId
              ? "Select country first"
              : loadingStates
                ? "Loading..."
                : "Select State"}
          </option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.stateId && (
          <span className="field-error">{errors.stateId}</span>
        )}
      </div>

      {/* ── City ── */}
      <div className="form-group">
        <label>City *</label>
        <select
          value={value.cityId || ""}
          onChange={(e) => handleChange("cityId", e.target.value)}
          className={errors.cityId ? "input-error" : ""}
          disabled={!value.stateId || loadingCities}
        >
          <option value="">
            {!value.stateId
              ? "Select state first"
              : loadingCities
                ? "Loading..."
                : "Select City"}
          </option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.cityId && <span className="field-error">{errors.cityId}</span>}
      </div>

      {/* ── Postal Code ── */}
      <div className="form-group">
        <label>Postal Code *</label>

        {/* India → dropdown from API */}
        {isIndia && value.cityId ? (
          loadingPostal ? (
            <select disabled>
              <option>Loading postal codes...</option>
            </select>
          ) : postalCodes.length > 0 ? (
            <select
              value={value.postalCode || ""}
              onChange={(e) =>
                onChange({ ...value, postalCode: e.target.value })
              }
              className={errors.postalCode ? "input-error" : ""}
            >
              <option value="">Select Postal Code</option>
              {postalCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          ) : (
            // API returned no results — fallback to manual input
            <input
              type="text"
              placeholder="Enter postal code manually"
              value={value.postalCode || ""}
              maxLength={10}
              onChange={(e) =>
                onChange({
                  ...value,
                  postalCode: e.target.value.replace(/\D/g, ""),
                })
              }
              className={errors.postalCode ? "input-error" : ""}
            />
          )
        ) : (
          // Non-India or no city selected → plain text input
          <input
            type="text"
            placeholder={
              !value.cityId ? "Select city first" : "Enter postal code"
            }
            value={value.postalCode || ""}
            maxLength={10}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            className={errors.postalCode ? "input-error" : ""}
            disabled={!value.cityId}
          />
        )}

        {errors.postalCode && (
          <span className="field-error">{errors.postalCode}</span>
        )}
      </div>
    </>
  );
};

export default LocationDropdowns;
