import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PaymentGateway from "./PaymentGateway";
import {
  trackViewCart,
  trackRemoveFromCart,
  trackBeginCheckout,
} from "../utils/analytics";
import {
  fetchCart,
  removeFromCart,
  updateQuantity,
  setCartOpen,
  selectCartItems,
  selectIsCartOpen,
  selectCartTotal,
  selectCartLoading,
} from "../redux/slices/cartSlice";

const ShoppingCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const isCartOpen = useSelector(selectIsCartOpen);
  const cartTotal = useSelector(selectCartTotal);
  const cartLoading = useSelector(selectCartLoading);

  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (isCartOpen && cartItems.length > 0) {
      trackViewCart(cartItems, cartTotal);
    }
  }, [isCartOpen, cartItems, cartTotal]);

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  const handleRemove = (cartItemId) => {
    dispatch(removeFromCart(cartItemId));
    trackRemoveFromCart(cartItemId);
  };

  const handleCheckout = () => {
    trackBeginCheckout(cartItems, cartTotal);
    setShowPayment(true);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  if (!isCartOpen) return null;

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 z-[1000]"
        onClick={() => dispatch(setCartOpen(false))}
      />

      {/* DRAWER-Full-screen on mobile, fixed-width sidebar on sm+ */}
      <div
        className="
          fixed z-[1001] bg-white flex flex-col
          inset-0
          sm:inset-auto sm:top-0 sm:right-0 sm:h-full sm:w-[420px]
          shadow-2xl
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[#eaeaec] flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-[#282c3f] m-0">
            Shopping Bag
            {cartItems.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[#94969f]">
                ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            onClick={() => dispatch(setCartOpen(false))}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f5f5f6] transition-colors bg-transparent border-none cursor-pointer text-[#282c3f]"
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body – scrollable */}
        <div className="flex-1 overflow-y-auto">
          {cartLoading ? (
            <ul className="divide-y divide-[#f0f0f0] m-0 p-0 list-none">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="flex gap-3 px-4 sm:px-5 py-4">
                  <div className="w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 rounded bg-[#f5f5f6] animate-pulse" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-3 bg-[#f5f5f6] animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-[#f5f5f6] animate-pulse rounded w-1/2" />
                    <div className="h-3 bg-[#f5f5f6] animate-pulse rounded w-1/3 mt-4" />
                  </div>
                </li>
              ))}
            </ul>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center py-16">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#d4d5d9" strokeWidth="1">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p className="text-[#282c3f] font-bold text-base m-0">Your bag is empty</p>
              <p className="text-[#94969f] text-sm m-0">Add items to it now</p>
              <button
                onClick={() => dispatch(setCartOpen(false))}
                className="mt-2 px-8 py-2.5 bg-[#ff3f6c] text-white font-bold text-sm rounded hover:bg-[#e8365d] transition-colors border-none cursor-pointer"
              >
                Shop Now
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f0f0] m-0 p-0 list-none">
              {cartItems.map((item) => (
                <li key={item.cartItemId} className="flex gap-3 px-4 sm:px-5 py-4">
                  {/* Product image */}
                  <div className="w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 rounded overflow-hidden bg-[#f5f5f6]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-[13px] sm:text-sm font-bold text-[#282c3f] m-0 leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-[13px] sm:text-sm font-bold text-[#282c3f] mt-1 m-0">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    {/* Qty + Remove row */}
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-[#d4d5d9] rounded overflow-hidden">
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({
                              cartItemId: item.cartItemId,
                              quantity: item.quantity - 1,
                            }))
                          }
                          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#282c3f] text-lg font-bold hover:bg-[#f5f5f6] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-[#282c3f] select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({
                              cartItemId: item.cartItemId,
                              quantity: item.quantity + 1,
                            }))
                          }
                          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#282c3f] text-lg font-bold hover:bg-[#f5f5f6] transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(item.cartItemId)}
                        className="text-[12px] font-semibold text-[#ff3f6c] bg-transparent border-none cursor-pointer hover:underline p-0"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer – sticky checkout bar */}
        {cartItems.length > 0 && (
          <div className="flex-shrink-0 border-t border-[#eaeaec] bg-white px-4 sm:px-5 py-4 space-y-3">
            {/* Price summary */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#535766] font-medium">Subtotal</span>
              <span className="text-base font-bold text-[#282c3f]">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-[11px] text-[#94969f] m-0">
              Shipping &amp; taxes calculated at checkout
            </p>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-[#ff3f6c] text-white font-bold text-sm rounded hover:bg-[#e8365d] active:scale-[0.98] transition-all border-none cursor-pointer tracking-wide"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentGateway
          onClose={() => setShowPayment(false)}
          total={cartTotal}
        />
      )}
    </>
  );
};

export default ShoppingCart;