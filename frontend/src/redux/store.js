import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import inventoryReducer from './slices/inventorySlice';
import searchReducer from './slices/searchSlice';
import couponReducer from './slices/couponSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        inventory: inventoryReducer,
        search: searchReducer,
        coupon: couponReducer,
    },
});
