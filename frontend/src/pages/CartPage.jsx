import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import PaymentGateway from "../components/PaymentGateway";
import api, { BACKEND_URL } from "../utils/api";
import "./CartPage.css";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    addToCart,
    clearCart,
  } = useCart();
  const [showPayment, setShowPayment] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (cartItems.length === 0) return;
    const loadRelated = async () => {
      try {
        const res = await api.get("/products");
        const allProducts = res.data.data || [];
        const cartProductIds = new Set(cartItems.map((item) => item.id));
        const cartCategoryIds = new Set(
          cartItems.map((item) => item.subCategoryId).filter(Boolean),
        );

        let related = allProducts.filter(
          (p) =>
            !cartProductIds.has(p.id) &&
            (cartCategoryIds.has(p.subCategoryId) ||
              cartCategoryIds.size === 0),
        );

        if (related.length < 4) {
          related = allProducts.filter((p) => !cartProductIds.has(p.id));
        }

        setRelatedProducts(related.slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    };
    loadRelated();
  }, [cartItems]);

  const handleAddRelated = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAddingId(product.id);
      await addToCart(product);
    } catch (err) {
      if (!localStorage.getItem("token")) navigate("/login");
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const subtotal = getCartTotal();
  const savings = cartItems.reduce((acc, item) => {
    return acc + ((item.price * (item.discount || 0)) / 100) * item.quantity;
  }, 0);

  return (
    <div className="cart-page">
      {/* Banner */}
      <div className="cart-banner">
        <div className="container">
          <div className="cart-banner-inner">
            <div>
              <h1>Shopping Cart</h1>
              <p className="cart-banner-sub">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in
                your cart
              </p>
            </div>
            <Link
              to="/products"
              className="cart-continue-link"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ flexShrink: 0 }}
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-layout">
              {/* Cart Items */}
              <div className="cart-items-section">
                <div className="cart-items-header">
                  <span>Product</span>
                  <span>Price</span>
                  <span>Quantity</span>
                  <span>Subtotal</span>
                  <span>
                    <button className="remove-all-btn" onClick={clearCart}>
                      Remove All
                    </button>
                  </span>
                </div>

                <div className="cart-items-list">
                  {cartItems.map((item) => {
                    const discountedPrice =
                      item.price - (item.price * (item.discount || 0)) / 100;
                    return (
                      <div key={item.cartItemId} className="cart-item-row">
                        {/* Product */}
                        <div className="cart-item-product">
                          {/* ── Clickable image → product detail ── */}
                          <div
                            className="cart-item-img-wrap"
                            onClick={() =>
                              navigate(`/products/${item.id || item.productId}`)
                            }
                            style={{ cursor: "pointer" }}
                            title="View product"
                          >
                            <img
                              src={item.image || "/placeholder.png"}
                              alt={item.name}
                            />
                          </div>
                          <div className="cart-item-details">
                            {/* ── Clickable name → product detail ── */}
                            <h4
                              onClick={() =>
                                navigate(
                                  `/products/${item.id || item.productId}`,
                                )
                              }
                              style={{ cursor: "pointer" }}
                              className="cart-item-name-link"
                            >
                              {item.name}
                            </h4>
                            {item.discount > 0 && (
                              <span className="cart-item-discount-tag">
                                {item.discount}% off
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="cart-item-price-col">
                          <span className="cart-item-current-price">
                            {formatPrice(discountedPrice)}
                          </span>
                          {item.discount > 0 && (
                            <span className="cart-item-original-price">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="cart-item-qty-col">
                          <div className="qty-control">
                            <button
                              className="qty-btn"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1,
                                )
                              }
                            >
                              −
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button
                              className="qty-btn"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1,
                                )
                              }
                              disabled={item.quantity >= item.stock}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="cart-item-subtotal">
                          {formatPrice(discountedPrice * item.quantity)}
                        </div>

                        {/* Remove */}
                        <button
                          className="cart-item-remove"
                          onClick={() => removeFromCart(item.cartItemId)}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="cart-summary">
                <div className="cart-summary-card">
                  <h3>Order Summary</h3>

                  <div className="summary-lines">
                    <div className="summary-line">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>{formatPrice(subtotal + savings)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="summary-line savings">
                        <span>Discount Savings</span>
                        <span>− {formatPrice(savings)}</span>
                      </div>
                    )}
                    <div className="summary-line">
                      <span>Delivery</span>
                      <span className="free-text">FREE</span>
                    </div>
                  </div>

                  <div className="summary-divider" />

                  <div className="summary-total">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {savings > 0 && (
                    <div className="summary-savings-note">
                      You're saving {formatPrice(savings)} on this order!
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-lg checkout-btn"
                    onClick={() => setShowPayment(true)}
                  >
                    Proceed to Checkout
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>

                  <Link to="/products" className="cart-keep-shopping">
                    Continue Shopping
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="cart-trust">
                  {[
                    {
                      icon: (
                        <>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </>
                      ),
                      text: "Secure Checkout",
                    },
                    {
                      icon: (
                        <>
                          <rect x="1" y="3" width="15" height="13" />
                          <path d="M16 8h4l3 3v5h-7V8z" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </>
                      ),
                      text: "Free Delivery",
                    },
                    {
                      icon: (
                        <>
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </>
                      ),
                      text: "Easy Returns",
                    },
                  ].map((t, i) => (
                    <div className="cart-trust-item" key={i}>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {t.icon}
                      </svg>
                      {t.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section className="cart-related">
                <div className="cart-related-header">
                  <div>
                    <span className="cart-related-eyebrow">
                      You Might Also Like
                    </span>
                    <h2 className="cart-related-title">Recommended for You</h2>
                  </div>
                  <Link to="/products" className="cart-continue-link">
                    View All →
                  </Link>
                </div>

                <div className="cart-related-grid">
                  {relatedProducts.map((product) => {
                    const discounted = product.discount
                      ? product.price - (product.price * product.discount) / 100
                      : product.price;
                    return (
                      /* ── Entire recommended card is clickable ── */
                      <div
                        className="cart-related-card"
                        key={product.id}
                        onClick={() => navigate(`/products/${product.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="cart-related-img-wrap">
                          <img
                            src={
                              product.image
                                ? `${BACKEND_URL}${product.image}`
                                : "/placeholder.png"
                            }
                            alt={product.name}
                          />
                          {product.discount > 0 && (
                            <span className="cart-related-discount">
                              -{product.discount}%
                            </span>
                          )}
                        </div>
                        <div className="cart-related-info">
                          <p className="cart-related-category">
                            {product.subCategory?.name || ""}
                          </p>
                          <h4 className="cart-related-name">{product.name}</h4>
                          <div className="cart-related-footer">
                            <div className="cart-related-prices">
                              <span className="cart-related-price">
                                {formatPrice(discounted)}
                              </span>
                              {product.discount > 0 && (
                                <span className="cart-related-original">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>
                            <button
                              className="cart-related-add-btn"
                              onClick={(e) => handleAddRelated(e, product)}
                              disabled={
                                addingId === product.id || product.stock === 0
                              }
                              title="Add to cart"
                            >
                              {addingId === product.id ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2.5"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2.5"
                                >
                                  <circle cx="9" cy="21" r="1" />
                                  <circle cx="20" cy="21" r="1" />
                                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showPayment && (
        <PaymentGateway
          onClose={() => setShowPayment(false)}
          total={subtotal}
        />
      )}
    </div>
  );
};

export default CartPage;
