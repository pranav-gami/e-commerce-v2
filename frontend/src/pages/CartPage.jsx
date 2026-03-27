import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import PaymentGateway from "../components/PaymentGateway";
import MoveToWishlistToast from "../components/MoveToWishlistToast";
import api, { BACKEND_URL } from "../utils/api";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    addToCart,
    clearCart,
  } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [wishlistToast, setWishlistToast] = useState(null); // item to show in toast
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "SHOPPING BAG";
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) return;
    const loadRelated = async () => {
      try {
        const res = await api.get("/products?limit=100");
        const allProducts = res.data.data?.products || res.data.data || [];
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
        if (related.length < 4)
          related = allProducts.filter((p) => !cartProductIds.has(p.id));
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

  // Called when user decreases quantity to 0 — show toast instead of silently removing
  const handleQuantityDecrease = async (item) => {
    if (item.quantity <= 1) {
      // Show "Move to Wishlist" toast
      setWishlistToast(item);
      // Actually remove from cart
      await removeFromCart(item.cartItemId);
    } else {
      await updateQuantity(item.cartItemId, item.quantity - 1);
    }
  };

  const handleMoveToWishlist = () => {
    if (wishlistToast) {
      addToWishlist(wishlistToast);
      setWishlistToast(null);
    }
  };

  const handleDirectMoveToWishlist = async (item) => {
    addToWishlist(item);
    await removeFromCart(item.cartItemId);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const subtotal = getCartTotal();
  const savings = cartItems.reduce(
    (acc, item) =>
      acc + ((item.price * (item.discount || 0)) / 100) * item.quantity,
    0,
  );

  return (
    <div className="bg-brand-light min-h-screen">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 ">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Empty left spacer */}
          <div className="w-28" />

          {/* Steps — center */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Link
              to="/cart"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-primary border-b-2 border-primary pb-0.5">
                BAG
              </span>
            </Link>
            <span className="text-gray-300">──────</span>
            <span className="text-gray-400">ADDRESS</span>
            <span className="text-gray-300">──────</span>
            <span className="text-gray-400">PAYMENT</span>
          </div>

          {/* Secure badge — right */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 w-28 justify-end">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            100% SECURE
          </div>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded shadow-sm">
            <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mb-5">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94969f"
                strokeWidth="1.2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-brand-dark">
              Hey, it feels so light!
            </h2>
            <p className="text-brand-gray mt-1 text-sm">
              There is nothing in your bag. Let's add some items.
            </p>
            <Link
              to="/products"
              className="mt-6 bg-primary text-white px-8 py-3 text-sm font-bold hover:bg-primary-hover transition-colors rounded-sm tracking-wider"
            >
              START SHOPPING
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-white rounded-t border border-brand-border text-xs font-extrabold text-brand-gray uppercase tracking-wider">
                <span>Product</span>
                <span className="text-center">Price</span>
                <span className="text-center">Quantity</span>
                <span className="text-center">Subtotal</span>
                <span>
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-600 font-bold text-xs"
                  >
                    Remove All
                  </button>
                </span>
              </div>

              <div className="border border-t-0 border-brand-border rounded-b bg-white divide-y divide-brand-border">
                {cartItems.map((item) => {
                  const discountedPrice =
                    item.price - (item.price * (item.discount || 0)) / 100;
                  const alreadyWishlisted = isInWishlist(item.id);

                  return (
                    <div key={item.cartItemId} className="p-4">
                      <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                        {/* Product */}
                        <div className="flex items-start gap-3">
                          <div
                            className="w-20 h-24 flex-shrink-0 bg-brand-light rounded overflow-hidden cursor-pointer"
                            onClick={() =>
                              navigate(`/products/${item.id || item.productId}`)
                            }
                          >
                            <img
                              src={item.image || "/placeholder.png"}
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              onClick={() =>
                                navigate(
                                  `/products/${item.id || item.productId}`,
                                )
                              }
                              className="text-sm font-bold text-brand-dark cursor-pointer hover:text-primary transition-colors line-clamp-2"
                            >
                              {item.name}
                            </h4>
                            {item.discount > 0 && (
                              <span className="inline-block mt-1 bg-primary-light text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                {item.discount}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-center">
                          <p className="text-sm font-bold text-brand-dark">
                            {formatPrice(discountedPrice)}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-xs text-brand-gray line-through">
                              {formatPrice(item.price)}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="flex justify-center">
                          <div className="flex items-center border border-brand-border rounded overflow-hidden">
                            <button
                              onClick={() => handleQuantityDecrease(item)}
                              className="w-8 h-8 flex items-center justify-center text-brand-gray hover:bg-brand-light hover:text-primary transition-colors text-lg font-bold"
                            >
                              −
                            </button>
                            <span className="w-8 h-8 flex items-center justify-center text-sm font-bold text-brand-dark border-x border-brand-border">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1,
                                )
                              }
                              disabled={item.quantity >= item.stock}
                              className="w-8 h-8 flex items-center justify-center text-brand-gray hover:bg-brand-light hover:text-primary transition-colors disabled:opacity-40 text-lg font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="text-center">
                          <p className="text-sm font-bold text-brand-dark">
                            {formatPrice(discountedPrice * item.quantity)}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="flex items-center gap-1 text-xs text-brand-gray hover:text-red-500 transition-colors font-semibold"
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
                            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                          Remove
                        </button>
                      </div>

                      {/* Move to Wishlist button (below each item) */}
                      <div className="mt-2 ml-[92px]">
                        <button
                          onClick={() => handleDirectMoveToWishlist(item)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                            alreadyWishlisted
                              ? "text-primary cursor-default"
                              : "text-brand-gray hover:text-primary"
                          }`}
                          disabled={alreadyWishlisted}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill={alreadyWishlisted ? "#ff3f6c" : "none"}
                            stroke={
                              alreadyWishlisted ? "#ff3f6c" : "currentColor"
                            }
                            strokeWidth="2"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          {alreadyWishlisted
                            ? "Already in Wishlist"
                            : "Move to Wishlist"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white border border-brand-border rounded shadow-sm sticky top-20">
                <div className="p-4 border-b border-brand-border">
                  <h3 className="text-sm font-extrabold text-brand-gray uppercase tracking-wider">
                    Price Details
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm text-brand-dark">
                    <span>Price ({cartItems.length} items)</span>
                    <span>{formatPrice(subtotal + savings)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-semibold">
                      <span>Discount</span>
                      <span>− {formatPrice(savings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-brand-dark">
                    <span>Delivery Charges</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="border-t border-brand-border pt-3">
                    <div className="flex justify-between font-extrabold text-brand-dark text-base">
                      <span>Total Amount</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                  {savings > 0 && (
                    <p className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-2 rounded-sm text-center">
                      You will save {formatPrice(savings)} on this order
                    </p>
                  )}
                </div>
                <div className="p-4 pt-0">
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      navigate("/checkout/address");
                    }}
                    className="w-full bg-primary text-white py-3.5 text-sm font-extrabold tracking-wider hover:bg-primary-hover transition-colors rounded-sm flex items-center justify-center gap-2"
                  >
                    PLACE ORDER
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
                  </button>
                  {/* <Link
                    to="/products"
                    className="block text-center text-xs text-primary font-semibold mt-3 hover:underline"
                  >
                    Continue Shopping →
                  </Link> */}
                </div>
                <div className="border-t border-brand-border p-4 flex flex-col gap-2">
                  {[
                    {
                      icon: (
                        <>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </>
                      ),
                      text: "Safe & Secure Payments",
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
                      text: "Free Delivery on this order",
                    },
                    {
                      icon: (
                        <>
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </>
                      ),
                      text: "Easy 7-day Returns",
                    },
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-brand-gray"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94969f"
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
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">
                  You Might Also Like
                </p>
                <h2 className="text-xl font-extrabold text-brand-dark mt-0.5">
                  Recommended for You
                </h2>
              </div>
              <Link
                to="/products"
                className="text-primary text-sm font-bold hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((product) => {
                const discounted = product.discount
                  ? product.price - (product.price * product.discount) / 100
                  : product.price;
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="group bg-white cursor-pointer overflow-hidden border border-brand-border hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="relative overflow-hidden aspect-[3/4] bg-brand-light">
                      <img
                        src={
                          product.image
                            ? `${BACKEND_URL}${product.image}`
                            : "/placeholder.png"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-brand-gray">
                        {product.subCategory?.name || ""}
                      </p>
                      <h4 className="text-sm font-semibold text-brand-dark line-clamp-2 mt-0.5">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 justify-between">
                        <div>
                          <span className="text-sm font-bold text-brand-dark">
                            {formatPrice(discounted)}
                          </span>
                          {product.discount > 0 && (
                            <span className="text-xs text-brand-gray line-through ml-1">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleAddRelated(e, product)}
                          disabled={
                            addingId === product.id || product.stock === 0
                          }
                          className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50"
                        >
                          {addingId === product.id ? (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2.5"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2.5"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
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
      </div>

      {showPayment && (
        <PaymentGateway
          onClose={() => setShowPayment(false)}
          total={subtotal}
        />
      )}

      {/* Move to Wishlist Toast */}
      {wishlistToast && (
        <MoveToWishlistToast
          item={wishlistToast}
          onMoveToWishlist={handleMoveToWishlist}
          onDiscard={() => setWishlistToast(null)}
          onClose={() => setWishlistToast(null)}
        />
      )}
    </div>
  );
};

export default CartPage;
