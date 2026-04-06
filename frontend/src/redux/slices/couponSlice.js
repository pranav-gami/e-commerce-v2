import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const validateCoupon = createAsyncThunk(
    'coupon/validate',
    async (code, { rejectWithValue }) => {
        try {
            const res = await api.post('/coupons/validate', { code });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Invalid coupon code');
        }
    },
);

export const fetchAvailableCoupons = createAsyncThunk(
    'coupon/fetchAvailable',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/coupons/available');
            return res.data.data?.coupons || [];
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch coupons');
        }
    },
);

//Slice

const initialState = {
    appliedCoupon: null,
    discountAmount: 0,
    finalTotal: 0,
    availableCoupons: [],
    validating: false,
    validateError: null,
    fetchingAvailable: false,
};

const couponSlice = createSlice({
    name: 'coupon',
    initialState,
    reducers: {
        removeCoupon(state) {
            state.appliedCoupon = null;
            state.discountAmount = 0;
            state.finalTotal = 0;
            state.validateError = null;
        },
        clearCouponError(state) {
            state.validateError = null;
        },
        resetCoupon(state) {
            return initialState;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(validateCoupon.pending, state => {
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
            .addCase(fetchAvailableCoupons.pending, state => {
                state.fetchingAvailable = true;
            })
            .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
                state.fetchingAvailable = false;
                state.availableCoupons = action.payload;
            })
            .addCase(fetchAvailableCoupons.rejected, state => {
                state.fetchingAvailable = false;
                state.availableCoupons = [];
            });
    },
});

export const { removeCoupon, clearCouponError, resetCoupon } = couponSlice.actions;

//Selectors
export const selectAppliedCoupon = state => state.coupon.appliedCoupon;
export const selectCouponDiscount = state => state.coupon.discountAmount;
export const selectCouponFinalTotal = state => state.coupon.finalTotal;
export const selectCouponValidating = state => state.coupon.validating;
export const selectCouponError = state => state.coupon.validateError;
export const selectAvailableCoupons = state => state.coupon.availableCoupons;

export default couponSlice.reducer;
