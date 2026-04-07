import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { BACKEND_URL } from '../../utils/api';

//Helpers
const normalizeItem = item => ({
    id: item.product.id,
    cartItemId: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    discount: item.product.discount || 0,
    image: item.product.image ? `${BACKEND_URL}${item.product.image}` : null,
    stock: item.product.stock,
    quantity: item.quantity,
});

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
    try {
        const res = await api.get('/cart');
        const items = res.data.data?.items || [];
        return items.map(normalizeItem);
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
    }
});

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async (product, { dispatch, rejectWithValue }) => {
        try {
            await api.post('/cart/items', { productId: product.id, quantity: 1 });
<<<<<<< HEAD
            // Await fetchCart so the store is fully updated before unwrap() resolves.
            // This prevents CartPage from briefly showing "empty" on Buy Now.
            const result = await dispatch(fetchCart()).unwrap();
            return result;
=======
            dispatch(fetchCart());
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
        }
    },
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (cartItemId, { rejectWithValue }) => {
        try {
            await api.delete(`/cart/items/${cartItemId}`);
            return cartItemId;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
        }
    },
);

export const updateQuantity = createAsyncThunk(
    'cart/updateQuantity',
    async ({ cartItemId, quantity }, { dispatch, rejectWithValue }) => {
        if (quantity <= 0) {
            dispatch(removeFromCart(cartItemId));
            return;
        }
        try {
            await api.patch(`/cart/items/${cartItemId}`, { quantity });
            return { cartItemId, quantity };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update quantity');
        }
    },
);

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
    try {
        await api.delete('/cart');
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
    }
});

//Slice
const initialState = {
    cartItems: [],
    isCartOpen: false,
    loading: false,
    error: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCartOpen: (state, action) => {
            state.isCartOpen = action.payload;
        },
        clearError: state => {
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder
            // fetchCart
            .addCase(fetchCart.pending, state => {
                state.loading = true;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.cartItems = action.payload;
                state.loading = false;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.cartItems = [];
                state.loading = false;
                state.error = action.payload;
            })
            // removeFromCart — optimistic update
            .addCase(removeFromCart.fulfilled, (state, action) => {
                state.cartItems = state.cartItems.filter(
                    item => item.cartItemId !== action.payload,
                );
            })
            // updateQuantity — optimistic update
            .addCase(updateQuantity.fulfilled, (state, action) => {
                if (!action.payload) return;
                const { cartItemId, quantity } = action.payload;
                const item = state.cartItems.find(i => i.cartItemId === cartItemId);
                if (item) item.quantity = quantity;
            })
            // clearCart
            .addCase(clearCart.fulfilled, state => {
                state.cartItems = [];
            });
    },
});

export const { setCartOpen, clearError } = cartSlice.actions;

// Selectors
export const selectCartItems = state => state.cart.cartItems;
export const selectIsCartOpen = state => state.cart.isCartOpen;
export const selectCartLoading = state => state.cart.loading;
export const selectCartTotal = state =>
    state.cart.cartItems.reduce((total, item) => {
        const discounted = item.price - (item.price * item.discount) / 100;
        return total + discounted * item.quantity;
    }, 0);
export const selectCartItemCount = state =>
    state.cart.cartItems.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer;
