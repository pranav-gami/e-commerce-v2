import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api, { BACKEND_URL } from "../utils/api";
import "./HomePage.css";

// ── Helper to render title with highlighted span ──
const renderTitle = (title, titleSpan) => {
  if (!titleSpan || !title.includes(titleSpan)) return title;
  const parts = title.split(titleSpan);
  return (
    <>
      {parts[0]}
      <span>{titleSpan}</span>
      {parts[1]}
    </>
  );
};

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Dynamic hero slides state ──
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Fetch hero slides from backend ──
  useEffect(() => {
    const loadHeroSlides = async () => {
      try {
        setHeroLoading(true);
        const res = await api.get("/hero");
        setHeroSlides(res.data.data || []);
      } catch (err) {
        console.error("Failed to load hero slides", err);
      } finally {
        setHeroLoading(false);
      }
    };
    loadHeroSlides();
  }, []);

  // ── Auto-slide (depends on heroSlides length) ──
  useEffect(() => {
    if (heroSlides.length === 0) return;
    const t = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const [catRes, prodRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
        ]);

        const allCategories = catRes.data.data?.categories || [];
        const allProducts = prodRes.data.data || [];

        const categoryIdsWithProducts = new Set(
          allProducts.map((p) => p.subCategory?.category?.id).filter(Boolean),
        );

        const filtered = allCategories.filter((cat) =>
          categoryIdsWithProducts.has(cat.id),
        );

        setCategories(
          filtered.map((cat) => ({
            ...cat,
            image: cat.image ? `${BACKEND_URL}${cat.image}` : null,
          })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await api.get("/products");
        const data = res.data.data || [];
        setFeaturedProducts(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch (err) {
        console.error(err);
      } finally {
        setFeaturedLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    try {
      setAddingId(product.id);
      await addToCart(product);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <section className="hero-carousel">
        <div className="carousel-container">
          {/* Loading skeleton */}
          {heroLoading && (
            <div className="carousel-slide active">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem" }}
                >
                  Loading...
                </div>
              </div>
            </div>
          )}

          {/* Dynamic slides */}
          {!heroLoading &&
            heroSlides.map((slide, i) => (
              <div
                key={slide.id}
                className={`carousel-slide ${i === currentSlide ? "active" : ""}`}
              >
                <img
                  src={`${BACKEND_URL}${slide.image}`}
                  alt={slide.eyebrow}
                  className="carousel-image"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="carousel-overlay">
                  <div className="container">
                    <div className="hero-content">
                      <span className="hero-eyebrow">{slide.eyebrow}</span>
                      <h1 className="hero-title">
                        {renderTitle(slide.title, slide.titleSpan)}
                      </h1>
                      <p className="hero-subtitle">{slide.subtitle}</p>
                      <div className="hero-actions">
                        <Link
                          to="/products"
                          className="btn btn-primary hero-cta"
                        >
                          Shop Now
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
                        </Link>
                        <Link to="/products" className="hero-cta-ghost">
                          Explore All
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* Indicators */}
          {!heroLoading && heroSlides.length > 0 && (
            <div className="carousel-indicators">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  className={`indicator ${i === currentSlide ? "active" : ""}`}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="container">
          <div className="trust-bar-inner">
            {[
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </>
                ),
                text: "Secure Payments",
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
              {
                icon: (
                  <>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </>
                ),
                text: "10L+ Happy Customers",
              },
            ].map((t, i) => (
              <div className="trust-item" key={i}>
                <svg
                  width="16"
                  height="16"
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

      {/* Categories */}
      <section className="categories">
        <div className="container">
          <div className="section-header">
            <div className="section-header-left">
              <span className="section-eyebrow">Browse</span>
              <h2 className="section-title">Shop by Category</h2>
            </div>
            {categories.length > 3 && (
              <Link to="/products" className="view-all-link">
                View All →
              </Link>
            )}
          </div>
          {categoriesLoading ? (
            <div className="categories-loading">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="category-skeleton" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="categories-grid">
              {categories.slice(0, 3).map((cat) => (
                <Link
                  to={`/products?category=${cat.id}`}
                  className="category-card"
                  key={cat.id}
                >
                  <div className="category-image-wrap">
                    {cat.image ? (
                      <>
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="category-image"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <div className="category-image-overlay" />
                      </>
                    ) : (
                      <div className="category-placeholder">
                        {cat.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3>{cat.name}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center" style={{ color: "var(--gray-600)" }}>
              No categories found.
            </p>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <div className="section-header">
            <div className="section-header-left">
              <span className="section-eyebrow">Handpicked</span>
              <h2 className="section-title">New Arrival</h2>
            </div>
            <Link to="/products" className="view-all-link">
              View All →
            </Link>
          </div>

          {featuredLoading ? (
            <div className="featured-loading">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="featured-skeleton" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="featured-grid">
              {featuredProducts.map((product) => {
                const discounted = product.discount
                  ? product.price - (product.price * product.discount) / 100
                  : product.price;
                return (
                  <Link
                    to={`/products/${product.id}`}
                    className="featured-card"
                    key={product.id}
                    style={{ textDecoration: "none" }}
                  >
                    <div className="featured-img-wrap">
                      <img
                        src={
                          product.image
                            ? `${BACKEND_URL}${product.image}`
                            : product.image
                        }
                        alt={product.name}
                      />
                      <span className="featured-badge">New</span>
                      {product.discount > 0 && (
                        <span className="featured-discount-badge">
                          {product.discount}% off
                        </span>
                      )}
                    </div>
                    <div className="featured-info">
                      <h4>{product.name}</h4>
                      <p className="featured-sub">
                        {product.subCategory?.name || ""}
                      </p>
                      <div className="featured-price-row">
                        <div className="featured-price-wrap">
                          <span className="featured-price">
                            {formatPrice(discounted)}
                          </span>
                          {product.discount > 0 && (
                            <span className="featured-original">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        <button
                          className="featured-cart-btn"
                          onClick={(e) => handleAddToCart(e, product)}
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
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center" style={{ color: "var(--gray-600)" }}>
              No featured products yet.
            </p>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section style={{ padding: "0 0 2.5rem" }}>
        <div className="container">
          <div className="promo-banner">
            <div className="promo-banner-text">
              <span className="promo-tag">Limited Time</span>
              <h2>Up to 40% Off on Electronics</h2>
              <p>Top brands, unbeatable prices — only this week.</p>
            </div>
            <Link
              to="/products"
              className="btn btn-primary"
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                padding: "0.7rem 1.8rem",
                borderRadius: "50px",
                fontFamily: "var(--font-body)",
              }}
            >
              Grab the Deal →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <div className="section-header-left">
              <span className="section-eyebrow">Why Us</span>
              <h2 className="section-title">Why Shop with Us</h2>
            </div>
          </div>
          <div className="features-grid">
            {[
              {
                icon: (
                  <>
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </>
                ),
                title: "Smart Cart",
                desc: "Real-time stock, instant updates.",
              },
              {
                icon: (
                  <>
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </>
                ),
                title: "Secure Checkout",
                desc: "Card, UPI, Net Banking — all protected.",
              },
              {
                icon: (
                  <>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </>
                ),
                title: "Buyer Protection",
                desc: "Full money-back on every order.",
              },
              {
                icon: (
                  <>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </>
                ),
                title: "Live Tracking",
                desc: "Know where your order is always.",
              },
            ].map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {f.icon}
                  </svg>
                </div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
