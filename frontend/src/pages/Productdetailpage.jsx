import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api, { BACKEND_URL } from "../utils/api";

const fmt = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const TABS = ["Description", "Reviews", "Terms & Conditions", "Shipping Info"];

const StarIcon = ({ filled, half }) => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    {half ? (
      <>
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#ff3f6c" />
            <stop offset="50%" stopColor="#dee2e6" />
          </linearGradient>
        </defs>
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="url(#half)"
          stroke="none"
        />
      </>
    ) : (
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? "#ff3f6c" : "#dee2e6"}
        stroke="none"
      />
    )}
  </svg>
);

const Stars = ({ rating }) => {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} filled={i < full} half={i === full && hasHalf} />
      ))}
    </span>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [tab, setTab] = useState("Description");
  const [qty, setQty] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [cartMsg, setCartMsg] = useState("");
  const [imgError, setImgError] = useState(false);
  const [review, setReview] = useState({});
  const imgRef = useRef(null);
  const cartItem = cartItems?.find(
    (c) => c.id === product?.id || c.productId === product?.id,
  );
  const cartQty = cartItem?.quantity || 0;
  const discounted = product
    ? product.discount
      ? product.price - (product.price * product.discount) / 100
      : product.price
    : 0;
  const inStock = product?.stock > 0;
  const lowStock = product?.stock > 0 && product.stock <= 5;
  const status = product?.status;
  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        const p = res.data.data;
        setReview({
          rating: p.averageRating,
          count: p.reviewCount,
          reviews: p.reviews,
        });

        const imgs = [];
        if (p.image) imgs.push(`${BACKEND_URL}${p.image}`);
        if (Array.isArray(p.images)) {
          p.images.forEach((i) => {
            const url = i.startsWith("http") ? i : `${BACKEND_URL}${i}`;
            if (!imgs.includes(url)) imgs.push(url);
          });
        }
        p._allImages = imgs.length ? imgs : ["/placeholder.png"];
        setProduct(p);
        setActiveImg(0);
        setImgError(false);
        const simRes = await api.get(
          `/products?subCategoryId=${p.subCategoryId}&limit=7`,
        );
        const all = simRes.data.data?.products || simRes.data.data || [];
        setSimilar(all.filter((x) => x.id !== p.id).slice(0, 6));
      } catch {
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} | YourStoreName`;
    } else {
      document.title = "Product | YourStoreName";
    }
  }, [product]);

  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddCart = async () => {
    if (!user) return navigate("/login");
    if (!inStock) return;
    try {
      setAddingCart(true);
      await addToCart({ ...product, quantity: qty });
      setCartMsg("Added to cart!");
      setTimeout(() => setCartMsg(""), 2500);
    } catch (err) {
      setCartMsg(err.response?.data?.message || "Failed to add");
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate("/login");
    if (!inStock) return;
    try {
      await addToCart({ ...product, quantity: qty });
      navigate("/cart");
    } catch {}
  };

  const handleCartInc = async () => {
    if (!user) return navigate("/login");
    if (cartQty >= product.stock) return;
    await updateQuantity(cartItem.cartItemId, cartQty + 1);
  };

  const handleCartDec = async () => {
    if (!user) return navigate("/login");
    await updateQuantity(cartItem.cartItemId, cartQty - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-light">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-gray text-sm font-semibold">
          Loading product…
        </p>
      </div>
    );
  }

  if (!product) return null;

  const allImages = product._allImages;
  const avgRating = review.rating;
  const ratingCount = review.count;

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-brand-border">
        <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-brand-gray flex-wrap">
          <Link
            to="/"
            className="hover:text-primary transition-colors font-medium"
          >
            Home
          </Link>
          <span>›</span>
          <Link
            to="/products"
            className="hover:text-primary transition-colors font-medium"
          >
            Products
          </Link>
          {product.subCategory?.category && (
            <>
              <span>›</span>
              <Link
                to={`/products?category=${product.subCategory.category.id}`}
                className="hover:text-primary transition-colors font-medium"
              >
                {product.subCategory.category.name}
              </Link>
            </>
          )}
          {product.subCategory && (
            <>
              <span>›</span>
              <span className="font-medium text-brand-dark">
                {product.subCategory.name}
              </span>
            </>
          )}
          <span>›</span>
          <span className="text-brand-muted font-medium truncate max-w-xs">
            {product.name}
          </span>
        </div>
      </nav>

      {/* Main Product */}
      <section className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Gallery */}
          <div className="lg:w-[520px] flex-shrink-0 flex gap-3">
            {/* Thumbnails */}
            <div className="flex flex-col gap-2 w-16 flex-shrink-0">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveImg(i);
                    setImgError(false);
                  }}
                  className={`w-16 h-16 border-2 rounded overflow-hidden transition-all ${activeImg === i ? "border-primary" : "border-brand-border hover:border-brand-muted"}`}
                >
                  <img
                    src={img}
                    alt={`view ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.png";
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div
              className="flex-1 relative overflow-hidden rounded bg-brand-light"
              style={{ aspectRatio: "3/4" }}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                ref={imgRef}
                src={imgError ? "/placeholder.png" : allImages[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-200"
                onError={() => setImgError(true)}
                style={
                  zoom
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: "scale(2.2)",
                      }
                    : {}
                }
              />
              {product.discount > 0 && (
                <span className="absolute top-3 left-3 bg-primary text-white text-xs font-extrabold px-2 py-1 rounded-sm">
                  -{product.discount}%
                </span>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="border border-brand-gray text-brand-gray text-sm font-bold px-4 py-2 bg-white">
                    OUT OF STOCK
                  </span>
                </div>
              )}
              {status !== "ACTIVE" && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="border border-brand-gray text-brand-gray text-sm font-bold px-4 py-2 bg-white">
                    Product is not Available
                  </span>
                </div>
              )}
              {lowStock && inStock && (
                <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm">
                  Only {product.stock} left!
                </span>
              )}
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-1 rounded-sm">
                Hover to zoom
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {product.subCategory?.category?.name && (
                <span className="text-xs font-bold text-brand-gray uppercase tracking-wider">
                  {product.subCategory.category.name}
                </span>
              )}
              {product.subCategory?.name && (
                <span className="text-xs text-brand-gray">
                  / {product.subCategory.name}
                </span>
              )}
              {product.isFeatured && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  ⭐ Featured
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-brand-dark leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                <span>{avgRating}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </div>
              <span className="text-sm text-brand-gray">
                ({ratingCount} Reviews)
              </span>
              <span className="text-brand-border">|</span>
              <span
                className={`text-sm font-semibold ${inStock ? "text-green-600" : "text-red-500"}`}
              >
                {inStock
                  ? `In Stock (${product.stock})`
                  : "The Product is currently sold out."}
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 pb-4 border-b border-brand-border">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-extrabold text-brand-dark">
                  {fmt(discounted)}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-base text-brand-gray line-through">
                      {fmt(product.price)}
                    </span>
                    <span className="text-base font-bold text-primary">
                      ({product.discount}% OFF)
                    </span>
                  </>
                )}
              </div>
              {product.discount > 0 && (
                <p className="text-xs text-brand-gray mt-1">
                  Inclusive of all taxes. Free delivery on this order.
                </p>
              )}
            </div>

            {/* Delivery */}
            <div className="py-4 border-b border-brand-border flex flex-col gap-3">
              {[
                {
                  icon: (
                    <>
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <path d="M16 8h4l3 5v3h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </>
                  ),
                  label: "Free Delivery",
                  sub: "On orders above ₹499",
                },
                {
                  icon: (
                    <>
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </>
                  ),
                  label: "Easy Returns",
                  sub: "7-day return policy",
                },
                {
                  icon: (
                    <>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </>
                  ),
                  label: "Secure Payment",
                  sub: "Razorpay protected",
                },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ff3f6c"
                      strokeWidth="2"
                    >
                      {d.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-dark">
                      {d.label}
                    </p>
                    <p className="text-xs text-brand-gray">{d.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description short */}
            {product.description && (
              <p className="py-4 text-sm text-brand-muted leading-relaxed border-b border-brand-border">
                {product.description}
              </p>
            )}

            {/* Cart message */}
            {cartMsg && (
              <div
                className={`mt-3 text-sm font-semibold px-4 py-2 rounded-sm ${cartMsg.includes("Failed") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}
              >
                {cartMsg}
              </div>
            )}

            {/* CTA */}
            <div className="mt-5 flex gap-3 flex-wrap">
              {cartQty > 0 ? (
                <div className="flex items-center border-2 border-primary rounded-sm overflow-hidden">
                  <button
                    onClick={handleCartDec}
                    className="w-12 h-12 flex items-center justify-center text-primary font-bold text-xl hover:bg-primary-light transition-colors"
                  >
                    −
                  </button>
                  <span className="w-16 h-12 flex items-center justify-center text-primary font-extrabold border-x-2 border-primary">
                    {cartQty}
                  </span>
                  <button
                    onClick={handleCartInc}
                    disabled={cartQty >= product.stock}
                    className="w-12 h-12 flex items-center justify-center text-primary font-bold text-xl hover:bg-primary-light transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddCart}
                  disabled={!inStock || addingCart || status !== "ACTIVE"}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-2 border-primary text-primary font-extrabold text-sm py-3 px-8 hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm tracking-wider"
                >
                  {addingCart ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                  )}
                  {addingCart ? "ADDING…" : "ADD TO BAG"}
                </button>
              )}

              <button
                onClick={handleBuyNow}
                disabled={!inStock || status !== "ACTIVE"}
                className="flex-1 sm:flex-none bg-primary text-white font-extrabold text-sm py-3 px-8 hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm tracking-wider"
              >
                BUY NOW
              </button>
            </div>

            {/* Share */}
            <div className="mt-5 flex items-center gap-3 text-sm text-brand-gray">
              <span className="font-semibold">Share:</span>
              {["F", "T", "W"].map((s, i) => (
                <button
                  key={i}
                  className="w-7 h-7 rounded-full border border-brand-border flex items-center justify-center text-xs font-bold text-brand-muted hover:border-primary hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-t border-brand-border">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex gap-0 border-b border-brand-border overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-bold tracking-wide border-b-2 transition-all ${tab === t ? "border-primary text-primary" : "border-transparent text-brand-gray hover:text-brand-dark"}`}
              >
                {t}
                {t === "Reviews" && (
                  <span className="ml-1.5 bg-brand-light text-brand-gray text-xs px-1.5 py-0.5 rounded-full">
                    {ratingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="py-8">
            {/* Description */}
            {tab === "Description" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-extrabold text-brand-dark mb-2">
                    About this product
                  </h2>
                  <p className="text-sm text-brand-muted leading-relaxed">
                    {product.description ||
                      "No description available for this product."}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      icon: "✓",
                      label: "Premium Quality",
                      text: "Carefully sourced and quality-checked before dispatch",
                    },
                    {
                      icon: "📦",
                      label: "Secure Packaging",
                      text: "Bubble-wrapped and packed in tamper-proof boxes",
                    },
                    {
                      icon: "🔄",
                      label: "Easy Exchange",
                      text: "Hassle-free 7-day exchange policy",
                    },
                    {
                      icon: "⭐",
                      label: "Genuine Product",
                      text: "100% authentic, no counterfeits guaranteed",
                    },
                    {
                      icon: "🛡️",
                      label: "Warranty",
                      text: "Manufacturer warranty applicable where stated",
                    },
                    {
                      icon: "📞",
                      label: "24/7 Support",
                      text: "Reach us anytime via email or WhatsApp",
                    },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="flex items-start gap-3 p-4 border border-brand-border rounded hover:border-primary transition-colors"
                    >
                      <span className="text-xl">{f.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-brand-dark">
                          {f.label}
                        </p>
                        <p className="text-xs text-brand-gray mt-0.5">
                          {f.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border border-brand-border rounded overflow-hidden">
                  <h3 className="text-sm font-extrabold text-brand-dark px-4 py-3 bg-brand-light border-b border-brand-border uppercase tracking-wider">
                    Product Specifications
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ["SKU", `PRD-${String(product.id).padStart(5, "0")}`],
                        [
                          "Category",
                          product.subCategory?.category?.name || "—",
                        ],
                        ["Subcategory", product.subCategory?.name || "—"],
                        ["Stock Available", `${product.stock} units`],
                        ["Status", product.status],
                        [
                          "Listed On",
                          new Date(product.createdAt).toLocaleDateString(
                            "en-IN",
                            { year: "numeric", month: "long", day: "numeric" },
                          ),
                        ],
                      ].map(([key, val], i) => (
                        <tr
                          key={key}
                          className={
                            i % 2 === 0 ? "bg-white" : "bg-brand-light"
                          }
                        >
                          <td className="px-4 py-2.5 font-semibold text-brand-muted w-40">
                            {key}
                          </td>
                          <td className="px-4 py-2.5 text-brand-dark">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reviews */}
            {tab === "Reviews" && (
              <div>
                <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-brand-light rounded">
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-5xl font-extrabold text-brand-dark">
                      {avgRating}
                    </span>
                    <Stars rating={avgRating} />
                    <p className="text-xs text-brand-gray mt-1">
                      Based on {ratingCount} reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { stars: 5, pct: 70 },
                      { stars: 4, pct: 20 },
                      { stars: 3, pct: 7 },
                      { stars: 2, pct: 2 },
                      { stars: 1, pct: 1 },
                    ].map(({ stars, pct }) => (
                      <div
                        key={stars}
                        className="flex items-center gap-3 text-xs text-brand-gray"
                      >
                        <span className="w-6 text-right font-semibold">
                          {stars}★
                        </span>
                        <div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {review.reviews?.map((r) => (
                    <div
                      key={r.id}
                      className="border border-brand-border rounded p-5"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                          {r.user?.name
                            ? r.user.name
                                .split(" ")
                                .map((n) => n[0].toUpperCase())
                                .join("")
                            : "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-brand-dark">
                              {r.user.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Stars rating={r.rating} />
                            <span className="text-xs text-brand-gray">
                              {r.createdAt
                                ? new Date(r.createdAt).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-brand-dark mb-1">
                        {r.title}
                      </h4>
                      <p className="text-sm text-brand-muted leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms */}
            {tab === "Terms & Conditions" && (
              <div className="max-w-3xl">
                <h2 className="text-lg font-extrabold text-brand-dark mb-1">
                  Terms & Conditions
                </h2>
                <p className="text-xs text-brand-gray mb-6">
                  Last updated: March 1, 2026
                </p>
                <div className="space-y-5">
                  {[
                    {
                      title: "1. Acceptance of Terms",
                      body: "By accessing or purchasing from our platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our service.",
                    },
                    {
                      title: "2. Product Descriptions",
                      body: "We strive to ensure all product descriptions, images, and pricing are accurate. However, we do not warrant that product descriptions or other content on the site are error-free, complete, or current. In the event of an error, we reserve the right to correct it and update your order accordingly.",
                    },
                    {
                      title: "3. Pricing & Payment",
                      body: "All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We accept payments via Razorpay, which supports UPI, credit/debit cards, net banking, and wallets. Prices are subject to change without notice.",
                    },
                    {
                      title: "4. Order Cancellations",
                      body: "Orders can be cancelled before they are shipped. Once shipped, cancellations are not accepted. For paid orders, refunds are processed to the original payment method within 5–7 business days through Razorpay.",
                    },
                    {
                      title: "5. Return & Refund Policy",
                      body: "We offer a 7-day easy return policy for most items. Products must be returned in their original, unused condition with all packaging intact. Items damaged due to customer misuse are not eligible for returns.",
                    },
                    {
                      title: "6. Intellectual Property",
                      body: "All content on this platform, including logos, images, product descriptions, and software, is the intellectual property of the company and may not be reproduced without written permission.",
                    },
                    {
                      title: "7. Limitation of Liability",
                      body: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of our products or platform.",
                    },
                    {
                      title: "8. Contact Us",
                      body: "For any questions regarding these Terms & Conditions, please reach out to our support team through the Contact page. We aim to respond to all queries within 24 business hours.",
                    },
                  ].map((item) => (
                    <div key={item.title}>
                      <h3 className="text-sm font-extrabold text-brand-dark mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-brand-muted leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping */}
            {tab === "Shipping Info" && (
              <div>
                <h2 className="text-lg font-extrabold text-brand-dark mb-5">
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {[
                    {
                      icon: "🚀",
                      title: "Express Delivery",
                      desc: "Available in select pin codes. Delivered within 1–2 business days. Additional charge of ₹99 applies.",
                    },
                    {
                      icon: "📦",
                      title: "Standard Delivery",
                      desc: "Free on orders above ₹499. Delivered within 4–7 business days across India.",
                    },
                    {
                      icon: "🌍",
                      title: "Pan-India Coverage",
                      desc: "We ship to all major cities and towns across India, including Tier 2 and Tier 3 cities.",
                    },
                    {
                      icon: "🔍",
                      title: "Order Tracking",
                      desc: "Once your order is shipped, you will receive an email with a tracking link to monitor your delivery in real-time.",
                    },
                    {
                      icon: "📋",
                      title: "Packaging",
                      desc: "All items are securely packed in tamper-proof boxes with bubble wrap for fragile items.",
                    },
                    {
                      icon: "⚠️",
                      title: "Delivery Delays",
                      desc: "Delivery timelines may be affected during public holidays, natural events, or peak seasons.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="p-4 border border-brand-border rounded hover:border-primary transition-colors"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <h4 className="text-sm font-bold text-brand-dark mt-2 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-brand-gray leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-brand-light rounded p-5">
                  <h3 className="text-sm font-extrabold text-brand-dark mb-5 uppercase tracking-wider">
                    Typical Delivery Timeline
                  </h3>
                  <div className="flex flex-wrap gap-0">
                    {[
                      { step: "1", label: "Order Placed", sub: "Immediately" },
                      {
                        step: "2",
                        label: "Payment Confirmed",
                        sub: "Within minutes",
                      },
                      { step: "3", label: "Processing", sub: "1 business day" },
                      { step: "4", label: "Shipped", sub: "Day 2" },
                      { step: "5", label: "Out for Delivery", sub: "Day 4–7" },
                      { step: "6", label: "Delivered", sub: "At your door" },
                    ].map((s, i, arr) => (
                      <div key={s.step} className="flex items-center">
                        <div className="flex flex-col items-center text-center w-24">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-extrabold">
                            {s.step}
                          </div>
                          <p className="text-xs font-bold text-brand-dark mt-1.5">
                            {s.label}
                          </p>
                          <p className="text-[10px] text-brand-gray mt-0.5">
                            {s.sub}
                          </p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="h-0.5 w-8 bg-brand-border flex-shrink-0 -mt-5" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Similar Products */}
      {similar.length > 0 && (
        <section className="bg-brand-light py-10">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-brand-dark">
                Similar Products
              </h2>
              <Link
                to={`/products?subCategoryId=${product.subCategoryId}`}
                className="text-primary text-sm font-bold hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {similar.map((p) => {
                const dp = p.discount
                  ? p.price - (p.price * p.discount) / 100
                  : p.price;
                const img = p.image
                  ? `${BACKEND_URL}${p.image}`
                  : "/placeholder.png";
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="group bg-white cursor-pointer overflow-hidden border border-brand-border hover:shadow-md transition-shadow"
                  >
                    <div className="relative overflow-hidden aspect-[3/4] bg-brand-light">
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                        }}
                      />
                      {p.discount > 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-extrabold px-1 py-0.5 rounded-sm">
                          -{p.discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[10px] text-brand-gray truncate">
                        {p.subCategory?.name}
                      </p>
                      <h4 className="text-xs font-semibold text-brand-dark truncate mt-0.5">
                        {p.name}
                      </h4>
                      <p className="text-xs font-bold text-brand-dark mt-1">
                        {fmt(dp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
