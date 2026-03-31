import { useEffect, useRef } from "react";
import { useAppDispatch } from "../hooks";
import { setSearchQuery, fetchSuggestions } from "../slices/searchSlice";

const DEBOUNCE_MS = 1000;

export const useSearchDebounce = () => {
  const dispatch = useAppDispatch();
  const timerRef = useRef(null);

  const handleQueryChange = (query) => {
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
