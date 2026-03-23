import { useEffect } from "react";

/**
 * Myntra-style popup shown when cart item quantity reaches 0
 * Props:
 *   item       — the cart item being removed
 *   onMoveToWishlist — callback to move item to wishlist
 *   onDiscard  — callback to just discard (dismiss)
 *   onClose    — callback to close toast without action
 */
const MoveToWishlistToast = ({ item, onMoveToWishlist, onDiscard, onClose }) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!item) return null;

  const discounted = item.discount
    ? item.price - (item.price * item.discount) / 100
    : item.price;

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up w-[90vw] max-w-sm">
      <div className="bg-white rounded shadow-2xl border border-brand-border overflow-hidden">
        {/* Progress bar (auto-dismiss indicator) */}
        <div className="h-0.5 bg-brand-border">
          <div className="h-full bg-primary animate-[shrink_5s_linear_forwards]" style={{
            animation: "shrink 5s linear forwards",
          }} />
        </div>

        <div className="p-4 flex items-start gap-3">
          {/* Product image */}
          <div className="w-14 h-14 flex-shrink-0 bg-brand-light rounded overflow-hidden">
            <img src={item.image || "/placeholder.png"} alt={item.name}
              className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-gray font-medium">Item removed from bag</p>
            <p className="text-sm font-bold text-brand-dark truncate mt-0.5">{item.name}</p>
            <p className="text-xs font-bold text-primary mt-0.5">{formatPrice(discounted)}</p>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={onMoveToWishlist}
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-extrabold py-2 rounded-sm hover:bg-primary-hover transition-colors tracking-wider">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                SAVE TO WISHLIST
              </button>
              <button
                onClick={onDiscard}
                className="px-3 text-xs font-bold text-brand-gray hover:text-brand-dark border border-brand-border rounded-sm hover:bg-brand-light transition-colors">
                DISCARD
              </button>
            </div>
          </div>

          {/* Close */}
          <button onClick={onClose}
            className="flex-shrink-0 text-brand-gray hover:text-brand-dark transition-colors mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default MoveToWishlistToast;
