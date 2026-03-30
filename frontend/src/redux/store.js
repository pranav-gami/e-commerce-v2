import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import inventoryReducer from "./slices/inventorySlice";
import searchReducer from "./slices/searchSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    inventory: inventoryReducer,
    search: searchReducer,
  },
});
