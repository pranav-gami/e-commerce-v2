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

  const cartItem = useMemo(
    () => cartItems?.find((item) => item.productId === product.id),
    [cartItems, product.id],
  );

  const inStock = product.stock > 0;
  const isActive = product.status === "ACTIVE";

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const handleNavigate = () => navigate(`/products/${product.id}`);

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    dispatch(toggleWishlist(product));
    setWishlistMsg(inWishlist ? "Removed!" : "Wishlisted!");
    setTimeout(() => setWishlistMsg(""), 1800);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    dispatch(addToCart(product));
  };

  const handleUpdateQty = (e, delta) => {
    e.stopPropagation();
    if (!cartItem) return;
    dispatch(
      updateQuantity({
        cartItemId: cartItem.cartItemId,
        quantity: cartItem.quantity + delta,
      }),
    );
  };

  return (
    <div
      onClick={handleNavigate}
      className="group relative bg-white cursor-pointer"
      style={{ userSelect: "none" }}
    >
      {/* IMAGE */}
      <div
        className="relative overflow-hidden bg-[#f5f5f6]"
        style={{ aspectRatio: "3/4" }}
      >
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Discount badge */}
        {product.discount > 0 && (
          <span className="absolute top-0 left-0 bg-[#ff905a] text-white text-[10px] font-bold px-1.5 py-[3px]">
            {product.discount}% OFF
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center transition-opacity duration-150"
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
        </button>

        {/* Rating badge */}
        {product.reviewCount > 0 && (
          <div className="absolute bottom-1.5 left-1.5 bg-white px-1.5 py-[2px] flex items-center gap-[3px] text-[10px] font-semibold rounded shadow-sm">
            <span className="text-[#282c3f]">{product.averageRating}</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#14958f">
              <polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9" />
            </svg>
            <span className="text-[#94969f]">|</span>
            <span className="text-[#94969f]">{product.reviewCount}</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {(!inStock || !isActive) && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[11px] font-bold border border-[#94969f] px-2 py-0.5 bg-white text-[#535766]">
              {!inStock ? "OUT OF STOCK" : "UNAVAILABLE"}
            </span>
          </div>
        )}

        {/* Add to cart – appears on hover (desktop) */}
        {inStock && isActive && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            {cartItem ? (
              <div
                className="bg-white border-t border-[#eaeaec] flex items-center justify-center gap-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => handleUpdateQty(e, -1)}
                  className="flex-1 py-1.5 text-[16px] font-bold text-[#282c3f] hover:bg-[#f5f5f6] transition-colors border-r border-[#eaeaec]"
                >
                  −
                </button>
                <span className="px-4 text-[13px] font-bold text-[#282c3f]">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={(e) => handleUpdateQty(e, 1)}
                  disabled={cartItem.quantity >= product.stock}
                  className="flex-1 py-1.5 text-[16px] font-bold text-[#282c3f] hover:bg-[#f5f5f6] transition-colors border-l border-[#eaeaec] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full bg-white border-t border-[#eaeaec] text-[#282c3f] text-[11px] font-bold py-2 hover:bg-[#f5f5f6] transition-colors tracking-wide"
              >
                ADD TO BAG
              </button>
            )}
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="pt-2 pb-1 px-0">
        <p className="text-[12px] font-bold text-[#282c3f] truncate leading-tight">
          {product.subCategory?.category?.name || "Brand"}
        </p>
        <p className="text-[11px] text-[#535766] truncate leading-tight mt-0.5">
          {product.name}
        </p>

        {/* Price row */}
        <div className="flex flex-wrap items-center gap-x-1.5 mt-1">
          <span className="text-[12px] font-bold text-[#282c3f]">
            {formatPrice(discountedPrice)}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-[11px] line-through text-[#94969f]">
                {formatPrice(product.price)}
              </span>
              <span className="text-[10px] text-[#ff905a] font-semibold whitespace-nowrap">
                ({product.discount}% OFF)
              </span>
            </>
          )}
        </div>

        {wishlistMsg && (
          <p className="text-[10px] text-[#ff3f6c] mt-0.5 font-semibold">
            {wishlistMsg}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
