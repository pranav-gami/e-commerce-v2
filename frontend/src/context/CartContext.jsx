import { createContext, useContext, useState, useEffect } from "react";
import api, { BACKEND_URL } from "../utils/api";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get("/cart");
      const cart = res.data.data;
      const items = cart?.items || [];

      const normalized = items.map((item) => ({
        id: item.product.id,
        cartItemId: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        discount: item.product.discount || 0,
        image: item.product.image
          ? `${BACKEND_URL}${item.product.image}`
          : null,
        stock: item.product.stock,
        quantity: item.quantity,
      }));
      setCartItems(normalized);
    } catch (err) {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    try {
      await api.post("/cart/items", {
        productId: product.id,
        quantity: 1,
      });
      await fetchCart();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("Add to cart failed:", message);
      throw err; // let component show error (e.g. login prompt)
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/items/${cartItemId}`);
      setCartItems((prev) =>
        prev.filter((item) => item.cartItemId !== cartItemId),
      );
    } catch (err) {
      console.error("Remove from cart failed:", err.message);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }
    try {
      await api.patch(`/cart/items/${cartItemId}`, { quantity });
      setCartItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item,
        ),
      );
    } catch (err) {
      console.error("Update quantity failed:", err.message);
    }
  };

  // DELETE /cart
  const clearCart = async () => {
    try {
      await api.delete("/cart");
      setCartItems([]);
    } catch (err) {
      console.error("Clear cart failed:", err.message);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const discountedPrice = item.price - (item.price * item.discount) / 100;
      return total + discountedPrice * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    fetchCart,
    getCartTotal,
    getCartItemCount,
    isCartOpen,
    setIsCartOpen,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
