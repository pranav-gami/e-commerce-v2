import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchCart } from "../redux/slices/cartSlice";
import {
  selectAppliedCoupon,
  selectCouponDiscount,
  resetCoupon,
} from "../redux/slices/couponSlice";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaymentGateway = ({ total, addressId, onClose, isPage = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const appliedCoupon = useAppSelector(selectAppliedCoupon);
  const couponDiscount = useAppSelector(selectCouponDiscount);
  const finalTotal = Math.max(0, total - couponDiscount);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded)
        throw new Error("Payment SDK failed to load. Check your internet.");

      // Create Razorpay order — pass couponCode if applied
      const { data } = await api.post("/payment/create-order", {
        addressId,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      });

      if (!data.success)
        throw new Error(data.message || "Failed to create order");

      const { razorpayOrderId, amount, currency, keyId, orderId } = data.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Myntra",
        description: appliedCoupon
          ? `Order #${orderId} · Coupon ${appliedCoupon.code} applied`
          : `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payment/verify", {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              // Clean up coupon state after successful payment
              dispatch(resetCoupon());
              dispatch(fetchCart());
              navigate("/thank-you", { state: { orderId } });
            } else {
              setError("Payment verification failed. Contact support.");
            }
          } catch (err) {
            setError(
              err.response?.data?.message || "Payment verification failed.",
            );
          }
        },
        prefill: {},
        theme: { color: "#ff3f6c" },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setError(response.error.description || "Payment failed. Try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-brand-border">
        <h2 className="text-base font-extrabold text-brand-dark uppercase tracking-wider">
          Order Summary
        </h2>
        {!isPage && (
          <button
            onClick={onClose}
            className="text-brand-gray hover:text-brand-dark transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Price breakdown */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between text-sm text-brand-dark">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>

        {appliedCoupon && couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600 font-semibold">
            <span className="flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Coupon ({appliedCoupon.code})
            </span>
            <span>− {formatPrice(couponDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-brand-dark">
          <span>Delivery</span>
          <span className="text-green-600 font-semibold">FREE</span>
        </div>

        <div className="border-t border-brand-border pt-3 flex justify-between font-extrabold text-brand-dark text-base">
          <span>Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>

        {appliedCoupon && couponDiscount > 0 && (
          <p className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-2 rounded-sm text-center">
            Saving {formatPrice(couponDiscount)} with coupon{" "}
            {appliedCoupon.code}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* Pay button */}
      <div className="p-5 pt-0">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 text-sm font-extrabold tracking-wider hover:bg-primary-hover transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray="32"
                  strokeDashoffset="10"
                />
              </svg>
              Processing...
            </>
          ) : (
            <>
              PAY {formatPrice(finalTotal)}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-brand-gray">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Secured by Razorpay · 100% Safe
        </div>
      </div>
    </div>
  );

  if (isPage) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm">{content}</div>
    </div>
  );
};

export default PaymentGateway;
