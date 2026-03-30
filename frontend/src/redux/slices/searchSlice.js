import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { BACKEND_URL } from "../../utils/api";

// ── Thunk ─────────────────────────────────────────────────────────────────────
export const fetchSuggestions = createAsyncThunk(
  "search/fetchSuggestions",
  async (query, { rejectWithValue }) => {
    if (!query || query.trim().length < 2) return [];
    try {
      const res = await api.get(
        `/products/autocomplete?q=${encodeURIComponent(query.trim())}`,
      );
      const raw = res.data.data?.suggestions || [];
      return raw.map((p) => ({
        ...p,
        image: p.image
          ? p.image.startsWith("http")
            ? p.image
            : `${BACKEND_URL}${p.image}`
          : null,
      }));
    } catch {
      return rejectWithValue([]);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const initialState = {
  searchQuery: "",
  suggestions: [],
  isLoadingSuggestions: false,
  showSuggestions: false,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      if (!action.payload || action.payload.trim().length < 2) {
        state.suggestions = [];
        state.showSuggestions = false;
      }
    },
    hideSuggestions: (state) => {
      state.showSuggestions = false;
    },
    clearSearch: (state) => {
      state.searchQuery = "";
      state.suggestions = [];
      state.showSuggestions = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.isLoadingSuggestions = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
        state.showSuggestions = action.payload.length > 0;
        state.isLoadingSuggestions = false;
      })
      .addCase(fetchSuggestions.rejected, (state) => {
        state.suggestions = [];
        state.showSuggestions = false;
        state.isLoadingSuggestions = false;
      });
  },
});

export const { setSearchQuery, hideSuggestions, clearSearch } =
  searchSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectSearchQuery = (state) => state.search.searchQuery;
export const selectSuggestions = (state) => state.search.suggestions;
export const selectIsLoadingSuggestions = (state) =>
  state.search.isLoadingSuggestions;
export const selectShowSuggestions = (state) => state.search.showSuggestions;

export default searchSlice.reducer;
