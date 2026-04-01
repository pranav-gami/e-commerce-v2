import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// ── Thunks ────────────────────────────────────────────────────────────────────

/**
 * Validate a coupon code against the current cart.
 * Returns discount preview without applying it yet.
 */
export const validateCoupon = createAsyncThunk(
  "coupon/validate",
  async (code, { rejectWithValue }) => {
    try {
      const res = await api.post("/coupons/validate", { code });
      return res.data.data; // { valid, coupon, discountAmount, finalTotal, ... }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Invalid coupon code",
      );
    }
  },
);

/**
 * Fetch coupons available for the current user's cart.
 */
export const fetchAvailableCoupons = createAsyncThunk(
  "coupon/fetchAvailable",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/coupons/available");
      return res.data.data?.coupons || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch coupons",
      );
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  // Applied coupon state
  appliedCoupon: null, // { id, code, discountPct, categoryId, categoryName }
  discountAmount: 0, // ₹ discount amount
  finalTotal: 0, // total after coupon

  // Available coupons (shown in cart)
  availableCoupons: [],

  // Loading / error states
  validating: false,
  validateError: null,
  fetchingAvailable: false,
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    /** Remove applied coupon (user clicks ✕) */
    removeCoupon(state) {
      state.appliedCoupon = null;
      state.discountAmount = 0;
      state.finalTotal = 0;
      state.validateError = null;
    },
    /** Clear validation error */
    clearCouponError(state) {
      state.validateError = null;
    },
    /** Reset entire coupon state (e.g. after order placed) */
    resetCoupon(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── validateCoupon ──────────────────────────────────
      .addCase(validateCoupon.pending, (state) => {
        state.validating = true;
        state.validateError = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.validating = false;
        state.appliedCoupon = action.payload.coupon;
        state.discountAmount = action.payload.discountAmount;
        state.finalTotal = action.payload.finalTotal;
        state.validateError = null;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.validating = false;
        state.validateError = action.payload;
        state.appliedCoupon = null;
        state.discountAmount = 0;
        state.finalTotal = 0;
      })

      // ── fetchAvailableCoupons ───────────────────────────
      .addCase(fetchAvailableCoupons.pending, (state) => {
        state.fetchingAvailable = true;
      })
      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.fetchingAvailable = false;
        state.availableCoupons = action.payload;
      })
      .addCase(fetchAvailableCoupons.rejected, (state) => {
        state.fetchingAvailable = false;
        state.availableCoupons = [];
      });
  },
});

export const { removeCoupon, clearCouponError, resetCoupon } =
  couponSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectAppliedCoupon = (state) => state.coupon.appliedCoupon;
export const selectCouponDiscount = (state) => state.coupon.discountAmount;
export const selectCouponFinalTotal = (state) => state.coupon.finalTotal;
export const selectCouponValidating = (state) => state.coupon.validating;
export const selectCouponError = (state) => state.coupon.validateError;
export const selectAvailableCoupons = (state) => state.coupon.availableCoupons;

export default couponSlice.reducer;
