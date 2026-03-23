import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load from localStorage per user
  useEffect(() => {
    if (user) {
      const key = `wishlist_${user.id || user.email}`;
      const stored = localStorage.getItem(key);
      setWishlistItems(stored ? JSON.parse(stored) : []);
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const saveToStorage = useCallback((items) => {
    if (user) {
      const key = `wishlist_${user.id || user.email}`;
      localStorage.setItem(key, JSON.stringify(items));
    }
  }, [user]);

  const addToWishlist = useCallback((product) => {
    setWishlistItems((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev;
      const updated = [...prev, { ...product, addedAt: Date.now() }];
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((prev) => {
      const updated = prev.filter((i) => i.id !== productId);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some((i) => i.id === productId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback((product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      return false; // removed
    } else {
      addToWishlist(product);
      return true; // added
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    saveToStorage([]);
  }, [saveToStorage]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
      wishlistCount: wishlistItems.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
