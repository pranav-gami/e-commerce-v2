import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const { addToCart, updateQuantity, cartItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

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

  /* ── navigate to product detail on card click ── */
  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
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
    try {
      setError("");
      await updateQuantity(cartItem.cartItemId, quantity + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update cart");
    }
  };

  const handleDecrease = async (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    try {
      setError("");
      await updateQuantity(cartItem.cartItemId, quantity - 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update cart");
    }
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    if (!inStock) return;
    try {
      await addToCart(product);
      navigate("/cart");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to cart");
    }
  };

  return (
    <div
      className={`product-card ${!inStock ? "out-of-stock" : ""}`}
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div className="product-image-container">
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          className="product-image"
        />

        {inStock && lowStock && (
          <span className="stock-badge badge-warning">
            Only {product.stock} left!
          </span>
        )}

        {product.discount > 0 && (
          <span className="discount-badge">-{product.discount}%</span>
        )}
      </div>

      <div className="product-info">
        <p className="product-category">
          {product.subCategory?.name || product.category}
        </p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <div className="product-price-wrap">
            <span className="product-prices">
              <p className="product-price">{formatPrice(discountedPrice)}</p>
              {product.discount > 0 && (
                <>
                  <p className="product-original-price">
                    {formatPrice(product.price)}
                  </p>
                  <p className="product-discount-label">
                    {product.discount}% off
                  </p>
                </>
              )}
            </span>
          </div>

          {error && <p className="product-error">{error}</p>}

          <div className="product-actions">
            {quantity > 0 ? (
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={handleDecrease}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={handleIncrease}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                className={`btn-add-cart ${isAdding ? "adding" : ""}`}
                onClick={handleAddToCart}
                disabled={!inStock || isAdding}
              >
                {isAdding ? (
                  "Adding..."
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>
            )}

            <button
              className="btn-buy-now"
              onClick={handleBuyNow}
              disabled={!inStock}
              title="Buy Now"
            >
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
