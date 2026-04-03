import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/auth/profile');
            return res.data.data;
        } catch {
            return rejectWithValue(null);
        }
    },
);

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            const token = res.data.data?.data?.token;
            if (token) {
                localStorage.setItem('token', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const profile = await api.get('/auth/profile');
                return profile.data.data;
            }
            return rejectWithValue('No token received');
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Login failed');
        }
    },
);

export const logout = createAsyncThunk('auth/logout', async () => {
    try {
        await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
    try {
        await api.post('/auth/register', {
            ...data,
            countryId: data.countryId ? Number(data.countryId) : undefined,
            stateId: data.stateId ? Number(data.stateId) : undefined,
            cityId: data.cityId ? Number(data.cityId) : undefined,
        });
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
});

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (data, { rejectWithValue }) => {
        try {
            const payload = {
                name: data.name,
                phone: data.phone,
                address: data.address,
            };
            if (data.countryId) payload.countryId = Number(data.countryId);
            if (data.stateId) payload.stateId = Number(data.stateId);
            if (data.cityId) payload.cityId = Number(data.cityId);
            if (data.postalCode) payload.postalCode = data.postalCode;

            await api.put('/auth/profile', payload);
            const profile = await api.get('/auth/profile');
            return profile.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Update failed');
        }
    },
);

//Slice
const initialState = {
    user: null,
    authLoading: true,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: state => {
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder
            // fetchProfile
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.user = action.payload;
                state.authLoading = false;
            })
            .addCase(fetchProfile.rejected, state => {
                state.user = null;
                state.authLoading = false;
            })
            // login
            .addCase(login.pending, state => {
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.user = action.payload;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.error = action.payload;
            })
            // logout
            .addCase(logout.fulfilled, state => {
                state.user = null;
                state.error = null;
            })
            // updateProfile
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { clearError } = authSlice.actions;

//Selectors
export const selectUser = state => state.auth.user;
export const selectAuthLoading = state => state.auth.authLoading;
export const selectAuthError = state => state.auth.error;

//API helpers
export const forgotPassword = email =>
    api.post('/auth/forgot-password', { email }).then(r => r.data);
export const verifyOtp = (email, otp) =>
    api.post('/auth/verify-otp', { email, otp }).then(r => r.data);
export const updatePassword = (email, otp, newPassword) =>
    api.patch('/auth/update-password', { email, otp, newPassword }).then(r => r.data);
export const sendSignupOtp = email =>
    api.post('/auth/send-signup-otp', { email }).then(r => r.data);
export const verifySignupOtp = (email, otp) =>
    api.post('/auth/verify-signup-otp', { email, otp }).then(r => r.data);
export const getProfile = () => api.get('/auth/profile').then(r => r.data.data);

//Orders
export const getOrders = (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.status) query.set('status', params.status);
    return api.get(`/orders?${query.toString()}`).then(r => r.data.data);
};
export const cancelOrder = orderId => api.patch(`/orders/${orderId}/cancel`).then(r => r.data);

//Addresses
export const getAddresses = () => api.get('/addresses').then(r => r.data.addresses);
export const getCheckoutAddresses = () => api.get('/addresses/checkout').then(r => r.data.data);
export const addAddress = data => api.post('/addresses', data).then(r => r.data.data);
export const updateAddress = (id, data) => api.put(`/addresses/${id}`, data).then(r => r.data);
export const deleteAddress = id => api.delete(`/addresses/${id}`).then(r => r.data);
export const setDefaultAddress = id => api.patch(`/addresses/${id}/set-default`).then(r => r.data);

export default authSlice.reducer;
