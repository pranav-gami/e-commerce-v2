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
} from "../redux/slices/cartSlice";

const ShoppingCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const isCartOpen = useSelector(selectIsCartOpen);
  const cartTotal = useSelector(selectCartTotal);

  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (isCartOpen && cartItems.length > 0) {
      trackViewCart(cartItems, cartTotal);
    }
  }, [isCartOpen, cartItems, cartTotal]);

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
      <div
        className="overlay"
        onClick={() => dispatch(setCartOpen(false))}
      ></div>
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button
            className="close-btn"
            onClick={() => dispatch(setCartOpen(false))}
          >
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

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="cart-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">{formatPrice(item.price)}</p>
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                          className="qty-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity + 1,
                              }),
                            )
                          }
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.cartItemId)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Subtotal:</span>
              <span className="total-amount">{formatPrice(cartTotal)}</span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleCheckout}>
              Proceed to Checkout
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
