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
    [cartItems, product.id],
  );

  const quantity = cartItem?.quantity || 0;
  const inStock = product.stock > 0;
  const isActive = product.status === "ACTIVE";

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const handleNavigate = () => navigate(`/products/${product.id}`);

  const requireAuth = () => {
    if (!user) {
      navigate("/login");
      return false;
    }
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
      className="group relative bg-white cursor-pointer overflow-hidden hover:shadow-sm transition"
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/5] bg-[#f5f5f6] overflow-hidden">
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

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

        {!inStock && <Overlay label="OUT OF STOCK" />}
        {!isActive && <Overlay label="Not available" />}

        {/* HOVER PANEL */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-all duration-300">
          <div className="bg-white border-t border-[#eaeaec] p-2">
            <button
              onClick={handleWishlist}
              className={`w-full text-[12px] font-bold py-2 flex items-center justify-center gap-1.5 rounded
                ${
                  inWishlist
                    ? "bg-gray-700 text-white"
                    : "border border-[#d4d5d9] text-[#282c3f] hover:border-gray-600"
                }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
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

      {/* INFO */}
      <div className="px-2 py-2">
        <div className="relative overflow-hidden">
          <div className="transition-all duration-200 group-hover:opacity-0 group-hover:-translate-y-2">
            <p className="text-[16px] font-bold text-[#282c3f] truncate">
              {product.subCategory?.category?.name || "Brand"}
            </p>
            <p className="text-[14px] text-[#535766] truncate">
              {product.name}
            </p>
          </div>
          <div className="absolute inset-0 flex items-center opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
            <p className="text-[14px] text-[#535766]">Sizes: OneSize</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 text-[14px]">
          <span className="font-bold text-[#282c3f]">
            {formatPrice(discountedPrice)}
          </span>
          {product.discount > 0 && (
            <>
              <span className="line-through text-[#94969f]">
                {formatPrice(product.price)}
              </span>
              <span className="text-[#ff905a] font-semibold">
                ({product.discount}% OFF)
              </span>
            </>
          )}
        </div>

        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        {wishlistMsg && (
          <p className="text-[11px] text-primary mt-1 font-semibold">
            {wishlistMsg}
          </p>
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
