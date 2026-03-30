import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { BACKEND_URL } from "../utils/api";

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used within SearchProvider");
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    // Hide suggestions for short queries
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce — wait 300ms after user stops typing
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);

        const res = await api.get(
          `/products/autocomplete?q=${encodeURIComponent(query.trim())}`,
        );

        const raw = res.data.data?.suggestions || [];
        setSuggestions(raw);
        setShowSuggestions(raw.length > 0);
      } catch (err) {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 1000);
  }, []);

  const handleSetSearchQuery = useCallback(
    (query) => {
      setSearchQuery(query);
      fetchSuggestions(query);
    },
    [fetchSuggestions],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    clearTimeout(debounceTimer.current);
  }, []);

  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  const value = {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    suggestions,
    isLoadingSuggestions,
    showSuggestions,
    hideSuggestions,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};
