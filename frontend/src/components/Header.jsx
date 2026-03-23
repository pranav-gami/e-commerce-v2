import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useSearch } from "../context/SearchContext";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../utils/api";
import api from "../utils/api";
import { useWishlist } from "../context/WishlistContext";

const Header = () => {
  const { getCartItemCount } = useCart();
  const {
    searchQuery, setSearchQuery, suggestions, isLoadingSuggestions,
    showSuggestions, hideSuggestions, clearSearch,
  } = useSearch();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const cartCount = getCartItemCount();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navCategories, setNavCategories] = useState([]);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // ── Fetch real categories for nav ──
  useEffect(() => {
    const loadNavCategories = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
        ]);
        const allCategories = catRes.data.data?.categories || [];
        const allProducts = prodRes.data.data || [];
        const categoryIdsWithProducts = new Set(
          allProducts.map((p) => p.subCategory?.category?.id).filter(Boolean)
        );
        const filtered = allCategories.filter((cat) =>
          categoryIdsWithProducts.has(cat.id)
        );
        setNavCategories(filtered);
      } catch (err) {
        console.error("Failed to load nav categories", err);
      }
    };
    loadNavCategories();
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/products")) clearSearch();
  }, [location.pathname, clearSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) hideSuggestions();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hideSuggestions]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleSearchSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    hideSuggestions();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    else navigate("/products");
  };

  const handleSuggestionClick = (product) => {
    hideSuggestions();
    clearSearch();
    navigate(`/products/${product.id}`);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  // Check if a category nav link is active
  const isActiveCat = (catId) => location.search.includes(`category=${catId}`);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div className="border-b border-brand-border">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center gap-4 h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 mr-2">
            <span className="text-2xl font-extrabold tracking-tight text-primary">Shop</span>
            <span className="text-2xl font-extrabold tracking-tight text-brand-dark">.in</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-brand-light border border-brand-border rounded overflow-hidden">
              <input
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={handleSearchChange}
                autoComplete="off"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-brand-dark placeholder-brand-gray focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={clearSearch} className="p-2 text-brand-gray hover:text-brand-dark">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <button type="submit" className="bg-primary text-white px-4 py-2.5 hover:bg-primary-hover transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 bg-white border border-brand-border shadow-xl z-50 rounded-b overflow-hidden">
                {isLoadingSuggestions ? (
                  <div className="flex items-center gap-3 px-4 py-3 text-sm text-brand-gray">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <p className="px-4 py-2 text-xs font-bold text-brand-gray uppercase tracking-wider border-b border-brand-border">Products</p>
                    {suggestions.map((product) => {
                      const discounted = product.discount
                        ? product.price - (product.price * product.discount) / 100
                        : product.price;
                      return (
                        <div key={product.id} onClick={() => handleSuggestionClick(product)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-light cursor-pointer border-b border-brand-border last:border-0">
                          <div className="w-10 h-10 flex-shrink-0 bg-brand-light rounded overflow-hidden">
                            <img src={product.image ? `${BACKEND_URL}${product.image}` : "/placeholder.png"}
                              alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-dark truncate">{product.name}</p>
                            <p className="text-xs text-brand-gray">{product.subCategory?.name || product.category?.name || ""}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-brand-dark">{formatPrice(discounted)}</p>
                            {product.discount > 0 && (
                              <p className="text-xs text-primary font-semibold">-{product.discount}%</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div onClick={handleSearchSubmit}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-primary font-semibold hover:bg-primary-light cursor-pointer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                      View all results for "{searchQuery}"
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-4 text-sm text-brand-gray">No products found for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Profile */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1 hover:text-primary transition-colors group">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="text-[11px] font-semibold text-brand-dark group-hover:text-primary">
                    {user.name?.split(" ")[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-brand-border shadow-xl rounded z-50 overflow-hidden">
                    <div onClick={() => { setUserMenuOpen(false); navigate("/profile"); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-brand-light cursor-pointer border-b border-brand-border">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-dark truncate">{user.name}</p>
                        <p className="text-xs text-brand-gray truncate">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={() => { setUserMenuOpen(false); navigate("/orders"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-dark hover:bg-brand-light hover:text-primary transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      My Orders
                    </button>
                    <div className="border-t border-brand-border" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 px-4 py-1">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand-dark">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <div className="flex gap-1 text-[11px] font-semibold">
                  <Link to="/login" className="text-brand-dark hover:text-primary">Login</Link>
                  <span className="text-brand-gray">/</span>
                  <Link to="/signup" className="text-brand-dark hover:text-primary">Signup</Link>
                </div>
              </div>
            )}

            {/* Wishlist */}
            <button onClick={() => navigate("/wishlist")}
              className="flex flex-col items-center gap-0.5 px-4 py-1 hover:text-primary transition-colors group relative">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand-dark group-hover:text-primary">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-brand-dark group-hover:text-primary">Wishlist</span>
            </button>

            {/* Cart */}
            <button onClick={() => navigate("/cart")}
              className="flex flex-col items-center gap-0.5 px-4 py-1 hover:text-primary transition-colors group relative">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand-dark group-hover:text-primary">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-brand-dark group-hover:text-primary">Bag</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Dynamic Category Nav ── */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-screen-xl mx-auto px-4">
          <nav className="flex items-center overflow-x-auto scrollbar-hide">
            {/* All Products link */}
            <Link to="/products"
              className={`flex-shrink-0 px-5 py-3 text-xs font-bold border-b-2 transition-all tracking-wider whitespace-nowrap
                ${location.pathname === "/products" && !location.search.includes("category")
                  ? "border-primary text-primary"
                  : "border-transparent text-brand-dark hover:text-primary hover:border-primary"}`}>
              ALL
            </Link>

            {/* Real categories from API */}
            {navCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className={`flex-shrink-0 px-5 py-3 text-xs font-bold border-b-2 transition-all tracking-wider whitespace-nowrap
                  ${isActiveCat(cat.id)
                    ? "border-primary text-primary"
                    : "border-transparent text-brand-dark hover:text-primary hover:border-primary"}`}>
                {cat.name.toUpperCase()}
              </Link>
            ))}

            {/* Loading skeletons while fetching */}
            {navCategories.length === 0 && (
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 mx-5 my-3 h-3 w-16 bg-brand-light rounded animate-pulse" />
                ))}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
