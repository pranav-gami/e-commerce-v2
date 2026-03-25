import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";

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

const ProductCard = ({ product }) => {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [wishlistMsg, setWishlistMsg] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const avgRating = 4.5;
  const ratingCount = STATIC_REVIEWS.length;

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const status = product.status;

  const cartItem = cartItems?.find(
    (item) => item.id === product.id || item.productId === product.id,
  );
  const quantity = cartItem?.quantity || 0;

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const handleCardClick = () => navigate(`/products/${product.id}`);

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    const added = toggleWishlist(product);
    setWishlistMsg(added ? "Added to Wishlist!" : "Removed from Wishlist");
    setTimeout(() => setWishlistMsg(""), 2000);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    if (!inStock) return;
    try {
      setIsAdding(true);
      setError("");
      await addToCart(product);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrease = async (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    if (quantity >= product.stock) return;
    await updateQuantity(cartItem.cartItemId, quantity + 1);
  };

  const handleDecrease = async (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    await updateQuantity(cartItem.cartItemId, quantity - 1);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white cursor-pointer overflow-hidden border border-brand-border hover:shadow-md transition-all duration-300 ${
        !inStock ? "opacity-70" : ""
      }`}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-brand-light aspect-[3/4]">
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
            {product.discount}% OFF
          </span>
        )}

        {lowStock && inStock && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            Only {product.stock} left
          </span>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-gray border border-brand-border px-3 py-1 bg-white rounded-sm">
              OUT OF STOCK
            </span>
          </div>
        )}

        {status !== "ACTIVE" && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-gray border border-brand-border px-3 py-1 bg-white rounded-sm">
              Product is not Available
            </span>
          </div>
        )}

        {/* Default bottom (Rating) */}
        <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm px-2 py-1.5 text-xs flex items-center justify-between transition-opacity duration-300 group-hover:opacity-0">
          <div className="flex items-center gap-1">
            <span className="bg-green-600 text-white px-1 rounded text-[10px] font-bold">
              {avgRating} ★
            </span>
            <span className="text-brand-gray">({ratingCount})</span>
          </div>
        </div>

        {/* Hover Wishlist */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleWishlist}
            className={`w-full text-xs font-bold py-2.5 tracking-wider flex items-center justify-center gap-1.5
            ${
              isInWishlist(product.id)
                ? "bg-primary text-white"
                : "bg-brand-dark text-white hover:bg-primary"
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill={isInWishlist(product.id) ? "white" : "none"}
              stroke="white"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {isInWishlist(product.id) ? "WISHLISTED ✓" : "WISHLIST"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[11px] font-bold text-brand-dark uppercase tracking-wide truncate">
          {product.subCategory?.category?.name || "Brand"}
        </p>

        <p className="text-sm text-brand-gray line-clamp-2 mt-0.5">
          {product.name}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
          <span className="text-sm font-bold text-brand-dark">
            {formatPrice(discountedPrice)}
          </span>

          {product.discount > 0 && (
            <>
              <span className="text-xs text-brand-gray line-through">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs font-bold text-primary">
                ({product.discount}% OFF)
              </span>
            </>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {wishlistMsg && (
          <p className="text-xs text-primary font-semibold mt-1">
            {wishlistMsg}
          </p>
        )}

        {/* Cart */}
        <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
          {quantity > 0 ? (
            <div className="flex items-center border border-primary rounded overflow-hidden w-fit">
              <button
                onClick={handleDecrease}
                className="w-8 h-8 text-primary font-bold"
              >
                −
              </button>
              <span className="w-8 h-8 flex items-center justify-center text-sm font-bold text-primary border-x border-primary">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                disabled={quantity >= product.stock}
                className="w-8 h-8 text-primary font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!inStock || isAdding || status !== "ACTIVE"}
              className="w-full border border-primary text-primary text-xs font-bold py-2 rounded-sm hover:bg-primary hover:text-white transition-all disabled:opacity-50"
            >
              {isAdding ? "ADDING..." : "ADD TO BAG"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
