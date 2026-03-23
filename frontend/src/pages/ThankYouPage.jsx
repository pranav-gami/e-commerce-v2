import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { trackPurchase } from "../utils/analytics";
import "./ThankYouPage.css";

const ThankYouPage = () => {
  const { clearCart, getCartTotal } = useCart(); // Keep getCartTotal for formatting, but actual total comes from location.state
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];
  const total = location.state?.total || 0;

  // Track purchase completion and clear cart
  useEffect(() => {
    if (cartItems.length > 0) {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      trackPurchase(cartItems, total, transactionId);
      // Clear cart after tracking the purchase
      clearCart();
    }
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="thank-you-page">
      <div className="container">
        <div className="success-card">
          {/* Success Icon */}
          <div className="success-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="success-title">Order Placed Successfully!</h1>
          <p className="success-subtitle">Thank you for your purchase!</p>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="order-summary-section">
              <h2>Order Summary</h2>
              <div className="order-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div className="order-item-details">
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p className="item-price">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <span>Total Amount:</span>
                <span className="total-price">{formatPrice(total)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="thank-you-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Continue Shopping
            </Link>
            <Link to="/orders" className="btn btn-outline btn-lg">
              View Orders
            </Link>
          </div>

          {/* Confetti Animation */}
          <div className="confetti">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
