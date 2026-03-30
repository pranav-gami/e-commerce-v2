import { useEffect, useRef } from "react";
import { useAppDispatch } from "../redux/hooks";
import { setSearchQuery, fetchSuggestions } from "../redux/slices/searchSlice";

// Debounce time in milliseconds — change this to adjust suggestion delay
const DEBOUNCE_MS = 300;

export const useSearchDebounce = () => {
  const dispatch = useAppDispatch();
  const timerRef = useRef(null);

  const handleQueryChange = (query) => {
    // Update the query in store immediately (for the input value)
    dispatch(setSearchQuery(query));

    // Debounce the API call
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      dispatch(fetchSuggestions(query));
    }, DEBOUNCE_MS);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { handleQueryChange };
};
