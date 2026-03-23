import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useSearch } from "../context/SearchContext";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../utils/api";
import "./Header.css";

const Header = () => {
  const { getCartItemCount } = useCart();
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    isLoadingSuggestions,
    showSuggestions,
    hideSuggestions,
    clearSearch,
  } = useSearch();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getCartItemCount();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // ── Reset search when navigating away from /products ──
  useEffect(() => {
    if (!location.pathname.startsWith("/products")) {
      clearSearch();
    }
  }, [location.pathname, clearSearch]);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        hideSuggestions();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hideSuggestions]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleSearchSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    hideSuggestions();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
  };

  const handleSuggestionClick = (product) => {
    hideSuggestions();
    clearSearch();
    navigate(`/products/${product.id}`);
  };

  const handleProfileClick = () => {
    setUserMenuOpen(false);
    navigate("/profile");
  };

  const handleOrderClick = (e) => {
    e.preventDefault();
    navigate("/orders");
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-amazon">Shop</span>
            <span className="logo-in">.in</span>
          </Link>

          {/* Search Bar + Suggestions */}
          <div className="search-wrapper" ref={searchRef}>
            <form className="search-bar" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search for products, brands and more"
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={clearSearch}
                  aria-label="Clear"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <button type="submit" className="search-btn">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="search-suggestions">
                {isLoadingSuggestions ? (
                  <div className="suggestion-loading">
                    <div className="suggestion-spinner" />
                    Searching...
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="suggestion-label">Products</div>
                    {suggestions.map((product) => {
                      const discounted = product.discount
                        ? product.price -
                          (product.price * product.discount) / 100
                        : product.price;
                      return (
                        <div
                          key={product.id}
                          className="suggestion-item"
                          onClick={() => handleSuggestionClick(product)}
                        >
                          <div className="suggestion-img">
                            <img
                              src={
                                product.image
                                  ? `${BACKEND_URL}${product.image}`
                                  : "/placeholder.png"
                              }
                              alt={product.name}
                            />
                          </div>
                          <div className="suggestion-info">
                            <p className="suggestion-name">{product.name}</p>
                            <p className="suggestion-category">
                              {product.subCategory?.name ||
                                product.category?.name ||
                                ""}
                            </p>
                          </div>
                          <div className="suggestion-price">
                            <span className="suggestion-current">
                              {formatPrice(discounted)}
                            </span>
                            {product.discount > 0 && (
                              <span className="suggestion-discount">
                                -{product.discount}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div
                      className="suggestion-view-all"
                      onClick={handleSearchSubmit}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      View all results for "{searchQuery}"
                    </div>
                  </>
                ) : (
                  <div className="suggestion-empty">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="header-actions">
            <button className="cart-button" onClick={() => navigate("/cart")}>
              <div className="cart-icon-wrap">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </div>
              <span className="cart-text">Cart</span>
            </button>

            {user ? (
              <div className="user-menu-wrapper" ref={menuRef}>
                <button
                  className="user-btn"
                  onClick={() => setUserMenuOpen((p) => !p)}
                >
                  <div className="user-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="user-name">{user.name?.split(" ")[0]}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div
                      className="user-dropdown-header clickable"
                      onClick={handleProfileClick}
                    >
                      <div className="user-dropdown-avatar">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="user-dropdown-name">{user.name}</p>
                        <p className="user-dropdown-email">{user.email}</p>
                      </div>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                    <button
                      className="user-dropdown-item"
                      onClick={handleOrderClick}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      My Orders
                    </button>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="header-nav">
        <div className="container">
          <ul className="nav-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
