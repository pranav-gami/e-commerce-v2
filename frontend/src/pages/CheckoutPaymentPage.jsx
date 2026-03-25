import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import PaymentGateway from "../components/PaymentGateway";

const CheckoutPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartTotal } = useCart();

  const addressId = location.state?.addressId;
  const total = getCartTotal();

  // If someone lands here without an addressId, send them back
  useEffect(() => {
    if (!addressId) {
      navigate("/checkout/address", { replace: true });
    }
  }, [addressId]);

  if (!addressId) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Stepper bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <span className="text-2xl font-extrabold text-primary">Shop</span>
            <span className="text-2xl font-extrabold text-gray-800">.in</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Link to="/cart" className="text-gray-400 hover:text-gray-600 transition-colors">BAG</Link>
            <span className="text-gray-300">──────</span>
            <Link to="/checkout/address" className="text-gray-400 hover:text-gray-600 transition-colors">ADDRESS</Link>
            <span className="text-gray-300">──────</span>
            <span className="text-primary border-b-2 border-primary pb-0.5">PAYMENT</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            100% SECURE
          </div>
        </div>
      </div>

      {/* Payment gateway rendered inline — no modal backdrop, no close button */}
      <div className="max-w-md mx-auto px-4 py-10">
        <PaymentGateway
          total={total}
          addressId={addressId}
          onClose={() => navigate("/checkout/address")}
          isPage={true}
        />
      </div>
    </div>
  );
};

export default CheckoutPaymentPage;