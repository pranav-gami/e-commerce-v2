import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { selectUser } from "../redux/slices/authSlice";
import {
  selectCartItems,
  addToCart,
  updateQuantity,
} from "../redux/slices/cartSlice";
import {
  toggleWishlist,
  selectIsInWishlist,
} from "../redux/slices/wishlistSlice";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace("₹", "Rs. ");

const ProductCard = ({ product }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const user = useAppSelector(selectUser);
  const inWishlist = useAppSelector(selectIsInWishlist(product.id));
  const navigate = useNavigate();

  const [wishlistMsg, setWishlistMsg] = useState("");
  const [error, setError] = useState("");

  const cartItem = useMemo(
    () => cartItems?.find((item) => item.productId === product.id),
    [cartItems, product.id]
  );

  const quantity = cartItem?.quantity || 0;
  const inStock = product.stock > 0;
  const isActive = product.status === "ACTIVE";

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const handleNavigate = () => navigate(`/products/${product.id}`);

  const requireAuth = () => {
    if (!user) { navigate("/login"); return false; }
    return true;
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!requireAuth()) return;
    dispatch(toggleWishlist(product));
    setWishlistMsg(inWishlist ? "Removed from Wishlist" : "Added to Wishlist!");
    setTimeout(() => setWishlistMsg(""), 2000);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart(product));
  };

  const handleUpdateQuantity = (e, cartItemId, qty) => {
    e.stopPropagation();
    dispatch(updateQuantity({ cartItemId, quantity: qty }));
  };

  return (
    <div
      onClick={handleNavigate}
      className="group relative bg-white cursor-pointer overflow-hidden hover:shadow-md transition-shadow duration-200 rounded-sm"
    >
      {/* ── IMAGE ── */}
      <div className="relative aspect-[4/5] bg-[#f5f5f6] overflow-hidden">
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Rating badge */}
        {product.reviewCount && (
          <div className="absolute bottom-2 left-2 bg-white px-2 py-[2px] flex items-center text-[11px] font-semibold rounded shadow-sm">
            <span className="flex items-center gap-[2px] text-[#282c3f]">
              {product.averageRating}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#14958f">
                <polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9" />
              </svg>
            </span>
            <span className="mx-1 text-[#94969f]">|</span>
            <span className="text-[#94969f]">{product.reviewCount}</span>
          </div>
        )}

        {/* Wishlist icon – always visible on touch, hover-only on desktop */}
        <button
          onClick={handleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={`
            absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center
            transition-all duration-200
            sm:opacity-0 sm:group-hover:opacity-100
            ${inWishlist ? "opacity-100" : "opacity-100 sm:opacity-0"}
          `}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill={inWishlist ? "#ff3f6c" : "none"}
            stroke={inWishlist ? "#ff3f6c" : "#282c3f"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {!inStock && <Overlay label="OUT OF STOCK" />}
        {!isActive && <Overlay label="Not available" />}

        {/* Hover panel – desktop only (touch users use the icon above) */}
        <div className="hidden sm:block absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="bg-white border-t border-[#eaeaec] p-2">
            <button
              onClick={handleWishlist}
              className={`w-full text-[12px] font-bold py-2 flex items-center justify-center gap-1.5 rounded
                ${inWishlist
                  ? "bg-gray-700 text-white"
                  : "border border-[#d4d5d9] text-[#282c3f] hover:border-gray-600"
                }`}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24"
                fill={inWishlist ? "#ff3f6c" : "none"}
                stroke={inWishlist ? "#ff3f6c" : "#282c3f"}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {inWishlist ? "WISHLISTED" : "WISHLIST"}
            </button>
          </div>
        </div>
      </div>

      {/* ── INFO ── */}
      <div className="px-2 py-2">
        {/* Brand / name – slide-up on hover (desktop only) */}
        <div className="relative overflow-hidden min-h-[40px]">
          <div className="transition-all duration-200 sm:group-hover:opacity-0 sm:group-hover:-translate-y-2">
            <p className="text-[13px] sm:text-[15px] font-bold text-[#282c3f] truncate leading-tight">
              {product.subCategory?.category?.name || "Brand"}
            </p>
            <p className="text-[12px] sm:text-[13px] text-[#535766] truncate leading-tight">
              {product.name}
            </p>
          </div>
          <div className="hidden sm:flex absolute inset-0 items-center opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
            <p className="text-[13px] text-[#535766]">Sizes: OneSize</p>
          </div>
        </div>

        {/* Price row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          <span className="text-[13px] sm:text-[14px] font-bold text-[#282c3f]">
            {formatPrice(discountedPrice)}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-[12px] sm:text-[13px] line-through text-[#94969f]">
                {formatPrice(product.price)}
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#ff905a] font-semibold whitespace-nowrap">
                ({product.discount}% OFF)
              </span>
            </>
          )}
        </div>

        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        {wishlistMsg && (
          <p className="text-[11px] text-[#ff3f6c] mt-1 font-semibold">{wishlistMsg}</p>
        )}
      </div>
    </div>
  );
};

const Overlay = ({ label }) => (
  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
    <span className="text-xs font-bold border px-3 py-1 bg-white rounded-sm">
      {label}
    </span>
  </div>
);

export default ProductCard;