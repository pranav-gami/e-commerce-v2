import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { selectUser, logout } from "../redux/slices/authSlice";
import { selectCartItemCount } from "../redux/slices/cartSlice";
import { selectWishlistCount } from "../redux/slices/wishlistSlice";
import {
  selectSearchQuery,
  selectSuggestions,
  selectIsLoadingSuggestions,
  selectShowSuggestions,
  hideSuggestions,
  clearSearch,
} from "../redux/slices/searchSlice";
import { BACKEND_URL } from "../utils/api";
import api from "../utils/api";
import { useSearchDebounce } from "../redux/hooks/useSearchDebounce";

const Header = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const cartCount = useAppSelector(selectCartItemCount);
  const wishlistCount = useAppSelector(selectWishlistCount);
  const searchQuery = useAppSelector(selectSearchQuery);
  const suggestions = useAppSelector(selectSuggestions);
  const isLoadingSuggestions = useAppSelector(selectIsLoadingSuggestions);
  const showSuggestions = useAppSelector(selectShowSuggestions);
  const { handleQueryChange } = useSearchDebounce();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [navCategories, setNavCategories] = useState([]);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    const loadNavCategories = async () => {
      try {
        const res = await api.get("/categories");
        const allCategories = res.data.data?.categories || [];
        setNavCategories(allCategories.slice(0, 4));
      } catch (err) {
        console.error("Failed to load nav categories", err);
      }
    };
    loadNavCategories();
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/products")) dispatch(clearSearch());
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target))
        dispatch(hideSuggestions());
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target))
        dispatch(hideSuggestions());
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleSearchChange = (e) => handleQueryChange(e.target.value);

  const handleSearchSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    dispatch(hideSuggestions());
    setMobileSearchOpen(false);
    if (searchQuery.trim())
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    else navigate("/products");
  };

  const handleSuggestionClick = (product) => {
    dispatch(hideSuggestions());
    dispatch(clearSearch());
    setMobileSearchOpen(false);
    navigate(`/products/${product.id}`);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const isAllActive =
    location.pathname === "/products" && !location.search.includes("category");

  const isActiveCat = (catId) => location.search.includes(`category=${catId}`);

  const navLinkClass = (active) =>
    `flex-shrink-0 flex items-center justify-center h-14 px-3 font-bold tracking-[0.8px] whitespace-nowrap border-b-2 transition-all duration-150 no-underline text-sm ${
      active
        ? "border-[#ff3f6c] text-[#ff3f6c]"
        : "border-transparent text-[#282c3f] hover:text-[#ff3f6c] hover:border-[#ff3f6c]"
    }`;

  const SuggestionDropdown = () =>
    showSuggestions ? (
      <div className="absolute top-[calc(100%+2px)] left-0 right-0 bg-white border border-[#d4d5d9] shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-b z-[9999] overflow-hidden">
        {isLoadingSuggestions ? (
          <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#94969f]">
            <div className="w-3.5 h-3.5 border-2 border-[#ff3f6c] border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        ) : suggestions.length > 0 ? (
          <>
            <p className="px-4 py-2 text-[11px] font-bold text-[#94969f] uppercase tracking-[1px] border-b border-[#eaeaec] m-0">
              Products
            </p>
            {suggestions.map((product) => {
              const discounted = product.discount
                ? product.price - (product.price * product.discount) / 100
                : product.price;
              return (
                <div
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-[#f5f5f6] hover:bg-[#f5f5f6] transition-colors"
                >
                  <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[#f5f5f6]">
                    <img
                      src={
                        product.image
                          ? product.image.startsWith("http")
                            ? product.image
                            : `${BACKEND_URL}${product.image}`
                          : "/placeholder.png"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#282c3f] m-0 truncate">{product.name}</p>
                    <p className="text-[11px] text-[#94969f] mt-0.5 m-0">
                      {typeof product.subCategory === "string"
                        ? product.subCategory
                        : product.subCategory?.name || product.category?.name || ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-[#282c3f] m-0">{formatPrice(discounted)}</p>
                    {product.discount > 0 && (
                      <p className="text-[11px] text-[#ff3f6c] font-semibold mt-0.5 m-0">-{product.discount}%</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div
              onClick={handleSearchSubmit}
              className="flex items-center gap-2 px-4 py-3 text-[13px] text-[#ff3f6c] font-bold cursor-pointer hover:bg-[#fff0f3] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              View all results for &ldquo;{searchQuery}&rdquo;
            </div>
          </>
        ) : (
          <div className="px-4 py-3.5 text-[13px] text-[#94969f]">
            No products found for &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      {/* ── MAIN HEADER BAR ── */}
      <header className="sticky top-0 z-[999] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] w-full">
        <div className="w-full h-16 flex items-center px-3 sm:px-5 lg:px-8 gap-2">

          {/* Hamburger – mobile/tablet only */}
          <button
            className="lg:hidden flex-shrink-0 flex flex-col justify-center items-center w-9 h-9 gap-[5px] bg-transparent border-none cursor-pointer"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-[#282c3f] transition-all duration-200 origin-center ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#282c3f] transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#282c3f] transition-all duration-200 origin-center ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img
              src="/logo.ico"
              alt="Logo"
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain px-1 sm:px-3 lg:px-8"
            />
          </Link>

          {/* Desktop nav categories */}
          <nav className="hidden lg:flex items-center h-full overflow-x-auto [&::-webkit-scrollbar]:hidden flex-shrink-0 ml-4 xl:ml-10">
            <Link to="/products" className={navLinkClass(isAllActive)}>ALL</Link>
            {navCategories.map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} className={navLinkClass(isActiveCat(cat.id))}>
                {cat.name.toUpperCase()}
              </Link>
            ))}
            {navCategories.length === 0 &&
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 mx-3 h-2.5 w-14 bg-gray-100 rounded animate-pulse" />
              ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop / Tablet search bar */}
          <div
            ref={searchRef}
            className="relative hidden md:block mr-2 lg:mr-8 w-[clamp(180px,28vw,600px)]"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center h-10 bg-white border border-[#d4d5d9] rounded overflow-hidden"
            >
              <span className="pl-3 pr-1.5 flex items-center flex-shrink-0 text-[#94969f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={handleSearchChange}
                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#282c3f] placeholder-[#94969f] font-[inherit] py-0 pr-2 min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => dispatch(clearSearch())}
                  className="flex-shrink-0 flex items-center justify-center px-2 h-full bg-transparent border-none cursor-pointer text-[#94969f] hover:text-[#282c3f]"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </form>
            <SuggestionDropdown />
          </div>

          {/* Mobile search icon */}
          <button
            className="md:hidden flex-shrink-0 flex items-center justify-center w-9 h-9 bg-transparent border-none cursor-pointer text-[#282c3f]"
            onClick={() => setMobileSearchOpen((p) => !p)}
            aria-label="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* Right icons */}
          <div className="flex items-center flex-shrink-0">

            {/* Profile */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="group flex flex-col items-center justify-center gap-[2px] w-10 sm:w-[60px] h-14 bg-transparent border-none cursor-pointer p-0"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#282c3f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="group-hover:stroke-[#ff3f6c] transition-colors duration-150">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:block text-[11px] font-bold text-[#282c3f] leading-none group-hover:text-[#ff3f6c] transition-colors duration-150">
                  Profile
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-0.5 w-[220px] bg-white border border-[#d4d5d9] shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded z-[9999] overflow-hidden">
                  {user ? (
                    <>
                      <div
                        onClick={() => { setUserMenuOpen(false); navigate("/profile"); }}
                        className="flex items-center gap-3 px-4 py-3.5 border-b border-[#eaeaec] cursor-pointer hover:bg-[#f5f5f6] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#ff3f6c] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#282c3f] m-0 truncate">{user.name}</p>
                          <p className="text-[11px] text-[#94969f] mt-0.5 m-0 truncate">{user.email}</p>
                        </div>
                      </div>
                      {[
                        { label: "My Orders", path: "/orders" },
                        { label: "Wishlist", path: "/wishlist" },
                        { label: "Contact Us", path: "/contact" },
                      ].map(({ label, path }) => (
                        <button key={label} onClick={() => { setUserMenuOpen(false); navigate(path); }}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none border-b border-[#eaeaec] cursor-pointer text-[13px] text-[#282c3f] text-left hover:bg-[#f5f5f6] transition-colors">
                          {label}
                        </button>
                      ))}
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-[13px] text-[#ff3f6c] text-left hover:bg-[#fff0f3] transition-colors">
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-3.5 text-[13px] font-bold text-[#282c3f] no-underline border-b border-[#eaeaec] hover:bg-[#f5f5f6] transition-colors">
                        Login
                      </Link>
                      <Link to="/signup" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-3.5 text-[13px] font-bold text-[#282c3f] no-underline hover:bg-[#f5f5f6] transition-colors">
                        Signup
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button onClick={() => navigate("/wishlist")}
              className="group flex flex-col items-center justify-center gap-[2px] w-10 sm:w-[60px] h-14 bg-transparent border-none cursor-pointer p-0 relative">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#282c3f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="group-hover:stroke-[#ff3f6c] transition-colors duration-150 block">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ff3f6c] text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-[3px] leading-none">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-[11px] font-bold text-[#282c3f] leading-none group-hover:text-[#ff3f6c] transition-colors duration-150">
                Wishlist
              </span>
            </button>

            {/* Bag */}
            <button onClick={() => navigate("/cart")}
              className="group flex flex-col items-center justify-center gap-[2px] w-10 sm:w-[60px] h-14 bg-transparent border-none cursor-pointer p-0 relative">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#282c3f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="group-hover:stroke-[#ff3f6c] transition-colors duration-150 block">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ff3f6c] text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-[3px] leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-[11px] font-bold text-[#282c3f] leading-none group-hover:text-[#ff3f6c] transition-colors duration-150">
                Bag
              </span>
            </button>
          </div>
        </div>

        {/* Mobile search bar – expands below header on toggle */}
        {mobileSearchOpen && (
          <div className="md:hidden px-3 pb-3 bg-white border-t border-[#eaeaec]">
            <div ref={mobileSearchRef} className="relative">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center h-10 bg-white border border-[#d4d5d9] rounded overflow-hidden"
              >
                <span className="pl-3 pr-1.5 flex items-center flex-shrink-0 text-[#94969f]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search for products, brands and more"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                  autoComplete="off"
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#282c3f] placeholder-[#94969f] font-[inherit] py-0 pr-2 min-w-0"
                />
                {searchQuery && (
                  <button type="button" onClick={() => dispatch(clearSearch())}
                    className="flex-shrink-0 flex items-center justify-center px-2 h-full bg-transparent border-none cursor-pointer text-[#94969f] hover:text-[#282c3f]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </form>
              <SuggestionDropdown />
            </div>
          </div>
        )}
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-[998]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-[999] shadow-2xl overflow-y-auto flex flex-col">

            {/* Drawer header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#eaeaec] bg-[#ff3f6c]">
              {user ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-white text-[#ff3f6c] flex items-center justify-center font-bold text-base flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm m-0 truncate">{user.name}</p>
                    <p className="text-pink-100 text-[11px] m-0 truncate">{user.email}</p>
                  </div>
                </>
              ) : (
                <div className="flex gap-3 flex-1">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-1.5 bg-white text-[#ff3f6c] rounded font-bold text-sm no-underline">
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-1.5 border border-white text-white rounded font-bold text-sm no-underline">
                    Signup
                  </Link>
                </div>
              )}
              <button onClick={() => setMobileMenuOpen(false)}
                className="flex-shrink-0 bg-transparent border-none text-white cursor-pointer p-1 ml-auto" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Categories */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-[11px] font-bold text-[#94969f] uppercase tracking-[1px] mb-2 m-0">Categories</p>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 border-b border-[#f0f0f0] font-bold text-sm no-underline ${isAllActive ? "text-[#ff3f6c]" : "text-[#282c3f]"}`}>
                All Products
              </Link>
              {navCategories.map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.id}`} onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 border-b border-[#f0f0f0] font-bold text-sm no-underline ${isActiveCat(cat.id) ? "text-[#ff3f6c]" : "text-[#282c3f]"}`}>
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Account links */}
            {user && (
              <div className="px-4 pt-4 pb-6 border-t border-[#eaeaec] mt-2 flex flex-col">
                <p className="text-[11px] font-bold text-[#94969f] uppercase tracking-[1px] mb-2 m-0">Account</p>
                {[
                  { label: "My Profile", path: "/profile" },
                  { label: "My Orders", path: "/orders" },
                  { label: "Wishlist", path: "/wishlist" },
                  { label: "Contact Us", path: "/contact" },
                ].map(({ label, path }) => (
                  <button key={label} onClick={() => { setMobileMenuOpen(false); navigate(path); }}
                    className="w-full text-left py-3 border-b border-[#f0f0f0] font-bold text-sm text-[#282c3f] bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer">
                    {label}
                  </button>
                ))}
                <button onClick={handleLogout}
                  className="w-full text-left py-3 font-bold text-sm text-[#ff3f6c] bg-transparent border-none cursor-pointer mt-1">
                  Logout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Header;