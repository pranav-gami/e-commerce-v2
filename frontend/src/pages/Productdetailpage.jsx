import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api, { BACKEND_URL } from "../utils/api";
import "./Productdetailpage.css";
/* ── helpers ── */
const fmt = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const STATIC_REVIEWS = [
  {
    id: 1,
    name: "Priya Sharma",
    avatar: "PS",
    rating: 5,
    date: "March 12, 2026",
    title: "Absolutely love this product!",
    body: "The quality exceeded my expectations. Packaging was secure and delivery was fast. Will definitely order again from this store.",
    verified: true,
  },
  {
    id: 2,
    name: "Rohan Mehta",
    avatar: "RM",
    rating: 4,
    date: "February 28, 2026",
    title: "Great value for money",
    body: "Solid product, works exactly as described. Minor quibble with the packaging but the item itself is perfect.",
    verified: true,
  },
  {
    id: 3,
    name: "Anjali Patel",
    avatar: "AP",
    rating: 5,
    date: "February 15, 2026",
    title: "Exceeded all my expectations",
    body: "I was a bit skeptical ordering online but this completely changed my mind. Premium quality, fast shipping, and great customer support.",
    verified: false,
  },
  {
    id: 4,
    name: "Vikram Singh",
    avatar: "VS",
    rating: 4,
    date: "January 30, 2026",
    title: "Highly recommend!",
    body: "Used it for a month now and it's holding up great. Looks even better in person than the photos suggest.",
    verified: true,
  },
];

const TABS = ["Description", "Reviews", "Terms & Conditions", "Shipping Info"];

const StarIcon = ({ filled, half }) => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    {half ? (
      <>
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#e94560" />
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
        fill={filled ? "#e94560" : "#dee2e6"}
        stroke="none"
      />
    )}
  </svg>
);

const Stars = ({ rating }) => {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <span className="stars-row">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} filled={i < full} half={i === full && hasHalf} />
      ))}
    </span>
  );
};

/* ── main component ── */
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
  const imgRef = useRef(null);

  /* derived */
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

  /* ── fetch product ── */
  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        const p = res.data.data;
        // normalise images array
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
        // fetch similar (same subcategory)
        const simRes = await api.get(
          `/products?subCategoryId=${p.subCategoryId}`,
        );
        const all = simRes.data.data || [];
        setSimilar(all.filter((x) => x.id !== p.id).slice(0, 6));
      } catch {
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── zoom handler ── */
  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  /* ── cart actions ── */
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
      <div className="pdp-loader">
        <div className="pdp-spinner" />
        <p>Loading product…</p>
      </div>
    );
  }

  if (!product) return null;

  const allImages = product._allImages;
  const avgRating = 4.5;
  const ratingCount = STATIC_REVIEWS.length;

  return (
    <div className="pdp-page">
      {/* ── Breadcrumb ── */}
      <nav className="pdp-breadcrumb">
        <div className="pdp-container">
          <Link to="/">Home</Link>
          <span className="pdp-bc-sep">›</span>
          <Link to="/products">Products</Link>
          {product.subCategory?.category && (
            <>
              <span className="pdp-bc-sep">›</span>
              <Link
                to={`/products?category=${product.subCategory.category.id}`}
              >
                {product.subCategory.category.name}
              </Link>
            </>
          )}
          {product.subCategory && (
            <>
              <span className="pdp-bc-sep">›</span>
              <span>{product.subCategory.name}</span>
            </>
          )}
          <span className="pdp-bc-sep">›</span>
          <span className="pdp-bc-current">{product.name}</span>
        </div>
      </nav>

      {/* ── Main product section ── */}
      <section className="pdp-main">
        <div className="pdp-container pdp-grid">
          {/* ── Left: Image Gallery ── */}
          <div className="pdp-gallery">
            {/* Thumbnails */}
            <div className="pdp-thumbs">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  className={`pdp-thumb ${activeImg === i ? "active" : ""}`}
                  onClick={() => {
                    setActiveImg(i);
                    setImgError(false);
                  }}
                >
                  <img
                    src={img}
                    alt={`view ${i + 1}`}
                    onError={(e) => {
                      e.target.src = "/placeholder.png";
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Main image with zoom */}
            <div
              className={`pdp-main-img-wrap ${zoom ? "zoomed" : ""}`}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                ref={imgRef}
                src={imgError ? "/placeholder.png" : allImages[activeImg]}
                alt={product.name}
                className="pdp-main-img"
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
                <span className="pdp-badge-discount">-{product.discount}%</span>
              )}
              {!inStock && <div className="pdp-out-overlay">Out of Stock</div>}
              {lowStock && inStock && (
                <span className="pdp-badge-low">
                  Only {product.stock} left!
                </span>
              )}
              <span className="pdp-zoom-hint">Hover to zoom</span>
            </div>
          </div>

          {/* ── Right: Product Info ── */}
          <div className="pdp-info">
            {/* Category tag */}
            <div className="pdp-tag-row">
              {product.subCategory?.category?.name && (
                <span className="pdp-cat-tag">
                  {product.subCategory.category.name}
                </span>
              )}
              {product.subCategory?.name && (
                <span className="pdp-sub-tag">{product.subCategory.name}</span>
              )}
              {product.isFeatured && (
                <span className="pdp-featured-tag">⭐ Featured</span>
              )}
            </div>

            <h1 className="pdp-title">{product.name}</h1>

            {/* Rating summary */}
            <div className="pdp-rating-row">
              <Stars rating={avgRating} />
              <span className="pdp-rating-num">{avgRating}</span>
              <span className="pdp-rating-count">({ratingCount} reviews)</span>
              <span className="pdp-rating-sep">|</span>
              <span className={`pdp-stock-label ${inStock ? "in" : "out"}`}>
                {inStock ? `In Stock (${product.stock})` : "Out of Stock"}
              </span>
            </div>

            {/* Price */}
            <div className="pdp-price-block">
              <span className="pdp-price-main">{fmt(discounted)}</span>
              {product.discount > 0 && (
                <>
                  <span className="pdp-price-orig">{fmt(product.price)}</span>
                  <span className="pdp-price-save">
                    You save {fmt(product.price - discounted)} (
                    {product.discount}% off)
                  </span>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="pdp-divider" />

            {/* Description short */}
            {product.description && (
              <p className="pdp-short-desc">{product.description}</p>
            )}

            {/* Delivery info */}
            <div className="pdp-delivery-row">
              <div className="pdp-delivery-item">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <path d="M16 8h4l3 5v3h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <div>
                  <strong>Free Delivery</strong>
                  <p>On orders above ₹499</p>
                </div>
              </div>
              <div className="pdp-delivery-item">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <div>
                  <strong>Easy Returns</strong>
                  <p>7-day return policy</p>
                </div>
              </div>
              <div className="pdp-delivery-item">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                  <strong>Secure Payment</strong>
                  <p>Razorpay protected</p>
                </div>
              </div>
            </div>

            <div className="pdp-divider" />

            {/* Cart feedback */}
            {cartMsg && (
              <div
                className={`pdp-cart-msg ${cartMsg.includes("Failed") ? "error" : "success"}`}
              >
                {cartMsg}
              </div>
            )}

            {/* CTA buttons */}
            <div className="pdp-cta-row">
              {cartQty > 0 ? (
                <div className="pdp-qty-inline">
                  <button className="pdp-btn-outline" onClick={handleCartDec}>
                    −
                  </button>
                  <span>{cartQty} in cart</span>
                  <button
                    className="pdp-btn-outline"
                    onClick={handleCartInc}
                    disabled={cartQty >= product.stock}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  className={`pdp-btn-cart ${addingCart ? "adding" : ""}`}
                  onClick={handleAddCart}
                  disabled={!inStock || addingCart}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  {addingCart ? "Adding…" : "Add to Cart"}
                </button>
              )}
              <button
                className="pdp-btn-buy"
                onClick={handleBuyNow}
                disabled={!inStock}
              >
                Buy Now
              </button>
            </div>

            {/* Share row */}
            <div className="pdp-share-row">
              <span>Share:</span>
              {["Facebook", "Twitter", "WhatsApp"].map((s) => (
                <button key={s} className="pdp-share-btn">
                  {s[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs Section ── */}
      <section className="pdp-tabs-section">
        <div className="pdp-container">
          <div className="pdp-tab-nav">
            {TABS.map((t) => (
              <button
                key={t}
                className={`pdp-tab-btn ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Reviews" && (
                  <span className="pdp-tab-count">{ratingCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="pdp-tab-body">
            {/* Description tab */}
            {tab === "Description" && (
              <div className="pdp-tab-desc">
                <div className="pdp-desc-hero">
                  <h2>About this product</h2>
                  <p>
                    {product.description ||
                      "No description available for this product."}
                  </p>
                </div>
                <div className="pdp-features-grid">
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
                    <div className="pdp-feature-card" key={f.label}>
                      <span className="pdp-feat-icon">{f.icon}</span>
                      <strong>{f.label}</strong>
                      <p>{f.text}</p>
                    </div>
                  ))}
                </div>
                {/* Specs table */}
                <div className="pdp-specs">
                  <h3>Product Specifications</h3>
                  <table>
                    <tbody>
                      <tr>
                        <td>SKU</td>
                        <td>PRD-{String(product.id).padStart(5, "0")}</td>
                      </tr>
                      <tr>
                        <td>Category</td>
                        <td>{product.subCategory?.category?.name || "—"}</td>
                      </tr>
                      <tr>
                        <td>Subcategory</td>
                        <td>{product.subCategory?.name || "—"}</td>
                      </tr>
                      <tr>
                        <td>Stock Available</td>
                        <td>{product.stock} units</td>
                      </tr>
                      <tr>
                        <td>Status</td>
                        <td>
                          <span
                            className={`pdp-status ${product.status?.toLowerCase()}`}
                          >
                            {product.status}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Listed On</td>
                        <td>
                          {new Date(product.createdAt).toLocaleDateString(
                            "en-IN",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reviews tab */}
            {tab === "Reviews" && (
              <div className="pdp-tab-reviews">
                {/* Rating overview */}
                <div className="pdp-rating-overview">
                  <div className="pdp-rating-big">
                    <span className="pdp-rating-large">{avgRating}</span>
                    <Stars rating={avgRating} />
                    <p>Based on {ratingCount} reviews</p>
                  </div>
                  <div className="pdp-rating-bars">
                    {[
                      { stars: 5, pct: 70 },
                      { stars: 4, pct: 20 },
                      { stars: 3, pct: 7 },
                      { stars: 2, pct: 2 },
                      { stars: 1, pct: 1 },
                    ].map(({ stars, pct }) => (
                      <div className="pdp-bar-row" key={stars}>
                        <span>{stars}★</span>
                        <div className="pdp-bar-track">
                          <div
                            className="pdp-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review cards */}
                <div className="pdp-reviews-list">
                  {STATIC_REVIEWS.map((r) => (
                    <div className="pdp-review-card" key={r.id}>
                      <div className="pdp-review-header">
                        <div className="pdp-review-avatar">{r.avatar}</div>
                        <div>
                          <strong>{r.name}</strong>
                          {r.verified && (
                            <span className="pdp-verified">
                              ✓ Verified Purchase
                            </span>
                          )}
                          <p className="pdp-review-date">{r.date}</p>
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      <h4 className="pdp-review-title">{r.title}</h4>
                      <p className="pdp-review-body">{r.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms & Conditions tab */}
            {tab === "Terms & Conditions" && (
              <div className="pdp-tab-terms">
                <h2>Terms & Conditions</h2>
                <p className="pdp-terms-updated">Last updated: March 1, 2026</p>

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
                    body: "We offer a 7-day easy return policy for most items. Products must be returned in their original, unused condition with all packaging intact. Items damaged due to customer misuse are not eligible for returns. Refunds are initiated within 48 hours of receiving the returned item.",
                  },
                  {
                    title: "6. Intellectual Property",
                    body: "All content on this platform, including but not limited to logos, images, product descriptions, and software, is the intellectual property of the company and may not be reproduced without written permission.",
                  },
                  {
                    title: "7. Limitation of Liability",
                    body: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of our products or platform, even if we have been advised of the possibility of such damages.",
                  },
                  {
                    title: "8. Contact Us",
                    body: "For any questions regarding these Terms & Conditions, please reach out to our support team through the Contact page. We aim to respond to all queries within 24 business hours.",
                  },
                ].map((item) => (
                  <div className="pdp-terms-block" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Shipping Info tab */}
            {tab === "Shipping Info" && (
              <div className="pdp-tab-shipping">
                <h2>Shipping Information</h2>
                <div className="pdp-shipping-grid">
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
                      desc: "All items are securely packed in tamper-proof boxes with bubble wrap for fragile items. We go green with recycled materials wherever possible.",
                    },
                    {
                      icon: "⚠️",
                      title: "Delivery Delays",
                      desc: "Delivery timelines may be affected during public holidays, natural events, or peak seasons. We will notify you of any delays via email.",
                    },
                  ].map((item) => (
                    <div className="pdp-ship-card" key={item.title}>
                      <span className="pdp-ship-icon">{item.icon}</span>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Delivery timeline */}
                <div className="pdp-timeline">
                  <h3>Typical Delivery Timeline</h3>
                  <div className="pdp-timeline-steps">
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
                    ].map((s, i) => (
                      <div className="pdp-ts-item" key={s.step}>
                        <div className="pdp-ts-dot">
                          <span>{s.step}</span>
                        </div>
                        {i < 5 && <div className="pdp-ts-line" />}
                        <strong>{s.label}</strong>
                        <p>{s.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Similar Products ── */}
      {similar.length > 0 && (
        <section className="pdp-similar">
          <div className="pdp-container">
            <div className="pdp-section-head">
              <h2>Similar Products</h2>
              <Link
                to={`/products?subCategoryId=${product.subCategoryId}`}
                className="pdp-view-all"
              >
                View All →
              </Link>
            </div>
            <div className="pdp-similar-grid">
              {similar.map((p) => {
                const dp = p.discount
                  ? p.price - (p.price * p.discount) / 100
                  : p.price;
                const img = p.image
                  ? `${BACKEND_URL}${p.image}`
                  : "/placeholder.png";
                return (
                  <div
                    className="pdp-sim-card"
                    key={p.id}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="pdp-sim-img-wrap">
                      <img
                        src={img}
                        alt={p.name}
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                        }}
                      />
                      {p.discount > 0 && (
                        <span className="pdp-sim-discount">-{p.discount}%</span>
                      )}
                    </div>
                    <div className="pdp-sim-info">
                      <p className="pdp-sim-cat">{p.subCategory?.name}</p>
                      <h4 className="pdp-sim-name">{p.name}</h4>
                      <div className="pdp-sim-price-row">
                        <span className="pdp-sim-price">{fmt(dp)}</span>
                        {p.discount > 0 && (
                          <span className="pdp-sim-orig">{fmt(p.price)}</span>
                        )}
                      </div>
                      <button
                        className="pdp-sim-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${p.id}`);
                        }}
                      >
                        View Product
                      </button>
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
