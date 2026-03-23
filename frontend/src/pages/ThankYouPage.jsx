import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { trackPurchase } from "../utils/analytics";
import { BACKEND_URL } from "../utils/api";

const ThankYouPage = () => {
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = location.state?.cartItems || [];
  const total = location.state?.total || 0;
  const orderId = location.state?.orderId || null;
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (cartItems.length > 0) {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      trackPurchase(cartItems, total, transactionId);
      clearCart();
    }

    // Generate confetti pieces
    const pieces = [...Array(60)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      size: `${6 + Math.random() * 8}px`,
    }));
    setConfetti(pieces);
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const estimatedDelivery = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Confetti */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed;
          top: -10px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      {confetti.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* Main card */}
      <div className="relative z-10 w-full max-w-lg bg-white border border-brand-border rounded shadow-xl overflow-hidden">

        {/* Top success bar */}
        <div className="h-2 bg-gradient-to-r from-green-400 to-primary" />

        {/* Success header */}
        <div className="flex flex-col items-center text-center px-8 pt-10 pb-6 border-b border-brand-border">
          {/* Animated check circle */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5 animate-bounce">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1 className="text-2xl font-extrabold text-brand-dark">Order Placed! 🎉</h1>
          <p className="text-brand-gray text-sm mt-1">Thank you for shopping with Shop.in</p>

          {orderId && (
            <div className="mt-3 bg-brand-light border border-brand-border rounded px-4 py-2 text-xs font-bold text-brand-muted">
              Order ID: <span className="text-brand-dark">#{orderId}</span>
            </div>
          )}
        </div>

        {/* Delivery info */}
        <div className="grid grid-cols-3 divide-x divide-brand-border border-b border-brand-border">
          {[
            {
              icon: <><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
              label: "Delivery",
              value: "Free",
            },
            {
              icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>,
              label: "Est. Delivery",
              value: estimatedDelivery(),
            },
            {
              icon: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
              label: "Returns",
              value: "7 Days Easy",
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center py-4 px-2 text-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3f6c" strokeWidth="2" className="mb-1.5">
                {item.icon}
              </svg>
              <p className="text-[10px] font-bold text-brand-gray uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-extrabold text-brand-dark mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Order items */}
        {cartItems.length > 0 && (
          <div className="px-6 py-4 border-b border-brand-border">
            <h3 className="text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-3">
              Items Ordered
            </h3>
            <div className="space-y-3 max-h-52 overflow-y-auto">
              {cartItems.map((item, i) => {
                const discounted = item.price - (item.price * (item.discount || 0)) / 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 bg-brand-light rounded overflow-hidden border border-brand-border">
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-dark truncate">{item.name}</p>
                      <p className="text-xs text-brand-gray">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-extrabold text-brand-dark flex-shrink-0">
                      {formatPrice(discounted * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-brand-border">
              <span className="text-sm font-extrabold text-brand-dark">Total Paid</span>
              <span className="text-lg font-extrabold text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="px-6 py-4 border-b border-brand-border">
          <h3 className="text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-3">
            What happens next?
          </h3>
          <div className="space-y-2.5">
            {[
              { step: "1", text: "You'll receive a confirmation email shortly", done: true },
              { step: "2", text: "Our team will process your order within 24 hours", done: true },
              { step: "3", text: "You'll get a tracking link once shipped", done: false },
              { step: "4", text: `Estimated delivery by ${estimatedDelivery()}`, done: false },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-extrabold ${s.done ? "bg-primary text-white" : "bg-brand-border text-brand-gray"}`}>
                  {s.done ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : s.step}
                </div>
                <p className="text-xs text-brand-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-3">
          <Link
            to="/products"
            className="flex-1 bg-primary text-white text-sm font-extrabold py-3 rounded-sm hover:bg-primary-hover transition-colors tracking-wider flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            CONTINUE SHOPPING
          </Link>
          <Link
            to="/orders"
            className="flex-1 border-2 border-primary text-primary text-sm font-extrabold py-3 rounded-sm hover:bg-primary-light transition-colors tracking-wider flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            VIEW ORDERS
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;