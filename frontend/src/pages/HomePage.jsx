import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api, { BACKEND_URL } from "../utils/api";

const renderTitle = (title, titleSpan) => {
  if (!titleSpan || !title.includes(titleSpan)) return title;
  const parts = title.split(titleSpan);
  return (<>{parts[0]}<span className="text-primary">{titleSpan}</span>{parts[1]}</>);
};

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % heroSlides.length), 4500);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const [catRes, prodRes] = await Promise.all([api.get("/categories"), api.get("/products")]);
        const allCategories = catRes.data.data?.categories || [];
        const allProducts = prodRes.data.data || [];
        const categoryIdsWithProducts = new Set(allProducts.map((p) => p.subCategory?.category?.id).filter(Boolean));
        const filtered = allCategories.filter((cat) => categoryIdsWithProducts.has(cat.id));
        setCategories(filtered.map((cat) => ({ ...cat, image: cat.image ? `${BACKEND_URL}${cat.image}` : null })));
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
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const trustItems = [
    { icon: <><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>, text: "Free Delivery" },
    { icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>, text: "Secure Payments" },
    { icon: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>, text: "Easy Returns" },
    { icon: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></>, text: "10L+ Happy Customers" },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Carousel */}
      <section className="relative w-full overflow-hidden bg-brand-dark" style={{ height: "min(520px, 55vw)" }}>
        {heroLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {heroSlides.map((slide, i) => (
              <div key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? "opacity-100" : "opacity-0"}`}>
                <img src={`${BACKEND_URL}${slide.image}`} alt={slide.eyebrow}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent">
                  <div className="max-w-screen-xl mx-auto px-8 h-full flex items-center">
                    <div className="max-w-lg">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{slide.eyebrow}</span>
                      <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-2 leading-tight">
                        {renderTitle(slide.title, slide.titleSpan)}
                      </h1>
                      <p className="text-white/80 mt-3 text-base">{slide.subtitle}</p>
                      <div className="flex items-center gap-4 mt-6">
                        <Link to="/products"
                          className="bg-primary text-white px-7 py-3 text-sm font-bold tracking-wider hover:bg-primary-hover transition-colors rounded-sm flex items-center gap-2">
                          SHOP NOW
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                          </svg>
                        </Link>
                        <Link to="/products" className="text-white text-sm font-semibold border-b border-white/50 hover:border-white transition-colors">
                          Explore All
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Indicators */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {heroSlides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Trust Bar */}
      <div className="bg-brand-light border-y border-brand-border">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-center gap-8 flex-wrap">
          {trustItems.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-brand-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3f6c" strokeWidth="2">{t.icon}</svg>
              {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="py-10 max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Browse</p>
            <h2 className="text-2xl font-extrabold text-brand-dark mt-0.5">Shop by Category</h2>
          </div>
          {categories.length > 3 && (
            <Link to="/products" className="text-primary text-sm font-bold hover:underline">View All →</Link>
          )}
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-brand-light rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.slice(0, 3).map((cat) => (
              <Link to={`/products?category=${cat.id}`} key={cat.id}
                className="group relative aspect-[4/3] overflow-hidden rounded bg-brand-light block">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-light to-white">
                    <span className="text-5xl font-extrabold text-brand-border">{cat.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <h3 className="text-white font-extrabold text-xl">{cat.name}</h3>
                  <p className="text-white/80 text-sm mt-0.5 font-medium">Shop Now →</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-brand-gray text-sm">No categories found.</p>
        )}
      </section>

      {/* Featured Products */}
      <section className="py-10 bg-brand-light">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Handpicked</p>
              <h2 className="text-2xl font-extrabold text-brand-dark mt-0.5">New Arrivals</h2>
            </div>
            <Link to="/products" className="text-primary text-sm font-bold hover:underline">View All →</Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => {
                const discounted = product.discount
                  ? product.price - (product.price * product.discount) / 100
                  : product.price;
                return (
                  <Link to={`/products/${product.id}`} key={product.id}
                    className="group bg-white overflow-hidden hover:shadow-md transition-shadow duration-300"
                    style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="relative overflow-hidden aspect-[3/4] bg-brand-light">
                      <img
                        src={product.image ? `${BACKEND_URL}${product.image}` : "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-bold text-brand-dark uppercase tracking-wide">Brand</p>
                      <p className="text-sm text-brand-gray line-clamp-2 mt-0.5">{product.name}</p>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-sm font-bold text-brand-dark">{formatPrice(discounted)}</span>
                        {product.discount > 0 && (
                          <span className="text-xs text-brand-gray line-through">{formatPrice(product.price)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-brand-gray text-sm">No featured products yet.</p>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="bg-gradient-to-r from-brand-dark to-primary rounded overflow-hidden flex flex-col sm:flex-row items-center justify-between p-8 gap-6">
            <div>
              <span className="text-xs font-bold text-primary-light uppercase tracking-widest">Limited Time</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Up to 40% Off on Electronics</h2>
              <p className="text-white/70 mt-1 text-sm">Top brands, unbeatable prices — only this week.</p>
            </div>
            <Link to="/products"
              className="flex-shrink-0 bg-white text-primary text-sm font-extrabold px-7 py-3 rounded-sm hover:bg-primary-light transition-colors tracking-wider whitespace-nowrap">
              GRAB THE DEAL →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 border-t border-brand-border">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="mb-6">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Why Us</p>
            <h2 className="text-2xl font-extrabold text-brand-dark mt-0.5">Why Shop with Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></>, title: "Smart Cart", desc: "Real-time stock, instant updates." },
              { icon: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>, title: "Secure Checkout", desc: "Card, UPI, Net Banking — all protected." },
              { icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>, title: "Buyer Protection", desc: "Full money-back on every order." },
              { icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>, title: "Live Tracking", desc: "Know where your order is always." },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 border border-brand-border rounded hover:border-primary hover:shadow-sm transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff3f6c" strokeWidth="2">{f.icon}</svg>
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-sm">{f.title}</h3>
                  <p className="text-xs text-brand-gray mt-0.5">{f.desc}</p>
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
