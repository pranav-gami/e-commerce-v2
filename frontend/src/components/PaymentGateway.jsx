import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../utils/api";
import "./PaymentGateway.css";

const PaymentGateway = ({ onClose, total }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      const res = await api.post("/payment/create-order");
      const { razorpayOrderId, amount, currency, keyId, orderId } =
        res.data.data;

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Shop.in",
        description: "Order Payment",
        order_id: razorpayOrderId,

        handler: async (response) => {
          try {
            await api.post("/payment/verify", {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Navigate to thank you page
            navigate("/thank-you", {
              state: { cartItems: [...cartItems], total, orderId },
            });
            onClose();
          } catch (err) {
            setError("Payment verification failed. Contact support.");
            setIsProcessing(false);
          }
        },

        modal: {
          ondismiss: async () => {
            await api.post("/payment/failed", { orderId });
            setError("Payment cancelled. Please try again.");
            setIsProcessing(false);
          },
        },

        prefill: {
          name: "",
          email: "",
          contact: "",
        },

        theme: { color: "#e94560" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async (response) => {
        await api.post("/payment/failed", { orderId });
        setError(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate payment.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="payment-modal">
        <div className="payment-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="payment-body">
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handlePlaceOrder}>
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Items ({cartItems.length})</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span className="free">FREE</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Razorpay branding */}
            <div className="razorpay-note">
              <img
                src="https://razorpay.com/favicon.ico"
                alt="Razorpay"
                width="16"
                height="16"
              />
              <span>Secured by Razorpay — Cards, Net Banking supported</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isProcessing}
              style={{ width: "100%", borderRadius: "50px" }}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" /> Processing...
                </>
              ) : (
                `Pay ${formatPrice(total)}`
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default PaymentGateway;
