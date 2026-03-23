import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const res = await api.get(
          `/products?search=${encodeURIComponent(query.trim())}`,
        );
        const products = res.data.data || res.data || [];
        // Take top 6 suggestions
        setSuggestions(products.slice(0, 6));
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
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
