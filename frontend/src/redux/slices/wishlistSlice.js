import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ── Thunks ────────────────────────────────────────────────────────────────────
export const loadWishlist = createAsyncThunk("wishlist/load", async (user) => {
  if (!user) return [];
  const key = `wishlist_${user.id || user.email}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const saveToStorage = (userId, items) => {
  localStorage.setItem(`wishlist_${userId}`, JSON.stringify(items));
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const initialState = {
  items: [],
  userId: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const exists = state.items.find((i) => i.id === action.payload.id);
      if (exists) return;
      state.items.push({ ...action.payload, addedAt: Date.now() });
      if (state.userId) saveToStorage(state.userId, state.items);
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      if (state.userId) saveToStorage(state.userId, state.items);
    },
    toggleWishlist: (state, action) => {
      const exists = state.items.find((i) => i.id === action.payload.id);
      if (exists) {
        state.items = state.items.filter((i) => i.id !== action.payload.id);
      } else {
        state.items.push({ ...action.payload, addedAt: Date.now() });
      }
      if (state.userId) saveToStorage(state.userId, state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      if (state.userId) saveToStorage(state.userId, []);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadWishlist.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} = wishlistSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.items.length;
export const selectIsInWishlist = (productId) => (state) =>
  state.wishlist.items.some((i) => i.id === productId);

export default wishlistSlice.reducer;
