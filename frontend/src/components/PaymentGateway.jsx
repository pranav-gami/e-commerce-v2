import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { fetchCart, selectCartItems } from "../redux/slices/cartSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

const PaymentGateway = ({
  onClose,
  total,
  addressId: addressIdProp,
  isPage = false,
}) => {
  const location = useLocation();
  const addressId = addressIdProp ?? location.state?.addressId;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    document.title = "PAYMENT";
  }, []);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");
    setStatusMessage("");

    try {
      const res = await api.post("/payment/create-order", { addressId });
      const { razorpayOrderId, amount, currency, keyId, orderId } =
        res.data.data;

      const rzp = new window.Razorpay({
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "Myntra",

        handler: async (response) => {
          try {
            setStatusMessage("Confirming payment...");
            const verifyRes = await api.post("/payment/verify", {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.data.verified) {
              await dispatch(fetchCart());
              setIsProcessing(false);
              setStatusMessage("");
              onClose();
              navigate("/thank-you");
            }
          } catch (err) {
            if (err?.response?.status === 408) {
              setStatusMessage(
                "Payment received. Verifying... please check orders page.",
              );
              navigate("/orders");
              return;
            }
            setError(err?.response?.data?.message || "Verification failed");
            setIsProcessing(false);
            setStatusMessage("");
          }
        },

        modal: {
          ondismiss: () => {
            setError("Payment cancelled");
            setIsProcessing(false);
            setStatusMessage("");
          },
        },
      });

      rzp.on("payment.failed", (res) => {
        setError(res.error?.description || "Payment failed");
        setIsProcessing(false);
        setStatusMessage("");
        navigate("/orders");
      });

      rzp.open();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  return (
    <>
      {!isPage && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={
          isPage
            ? "bg-white rounded shadow-sm overflow-hidden w-full"
            : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-white rounded shadow-2xl overflow-hidden animate-fade-in"
        }
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-light">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold text-brand-dark">
              Payment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-border transition-colors text-brand-gray hover:text-brand-dark"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded mb-5 font-medium">
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 text-sm px-4 py-3 rounded mb-5 font-medium">
              {statusMessage}
            </div>
          )}

          <form onSubmit={handlePlaceOrder}>
            <div className="bg-brand-light rounded border border-brand-border p-4 mb-5">
              <h3 className="text-xs font-extrabold text-brand-gray uppercase tracking-wider mb-3">
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-brand-dark">
                  <span>Items ({cartItems.length})</span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-brand-dark">
                  <span>Delivery</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
                <div className="border-t border-brand-border pt-2 mt-2 flex justify-between">
                  <span className="text-sm font-extrabold text-brand-dark">
                    Total Amount
                  </span>
                  <span className="text-base font-extrabold text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            {cartItems.length > 0 && (
              <div className="mb-5 space-y-2 max-h-36 overflow-y-auto">
                {cartItems.map((item) => {
                  const discounted =
                    item.price - (item.price * (item.discount || 0)) / 100;
                  return (
                    <div
                      key={item.cartItemId}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 flex-shrink-0 bg-brand-light rounded overflow-hidden border border-brand-border">
                        <img
                          src={item.image || "/placeholder.png"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-brand-dark truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-brand-gray">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-brand-dark flex-shrink-0">
                        {formatPrice(discounted * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-brand-gray mb-5 bg-blue-50 border border-blue-100 px-3 py-2 rounded">
              <img
                src="https://razorpay.com/favicon.ico"
                alt="Razorpay"
                width="14"
                height="14"
              />
              <span>
                Secured by Razorpay — Cards, UPI, Net Banking supported
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              onClick={() => setError("")}
              className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {statusMessage || "PROCESSING..."}
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  PAY {formatPrice(total)}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsProcessing(false);
                setError("");
                onClose();
              }}
              className="w-full mt-3 text-sm text-brand-gray hover:text-brand-dark font-semibold py-2 transition-colors"
            >
              Cancel
            </button>

            {isProcessing && (
              <button
                type="button"
                onClick={() => {
                  setIsProcessing(false);
                  setStatusMessage("");
                  setError("Payment window closed. Please try again.");
                }}
                className="w-full mt-1 text-xs text-red-400 hover:text-red-600 font-semibold py-1 transition-colors"
              >
                Payment window closed? Click here to reset
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default PaymentGateway;
