import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectUser } from '../redux/slices/authSlice';
import { selectCartItems, addToCart, updateQuantity } from '../redux/slices/cartSlice';
import { toggleWishlist, selectIsInWishlist } from '../redux/slices/wishlistSlice';

const formatPrice = price =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    })
        .format(price)
        .replace('₹', 'Rs. ');

const ProductCard = ({ product }) => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector(selectCartItems);
    const user = useAppSelector(selectUser);
    const inWishlist = useAppSelector(selectIsInWishlist(product.id));
    const navigate = useNavigate();

    const [wishlistMsg, setWishlistMsg] = useState('');

    const cartItem = useMemo(
        () => cartItems?.find(item => item.productId === product.id),
        [cartItems, product.id],
    );

    const inStock = product.stock > 0;
    const isActive = product.status === 'ACTIVE';

    const discountedPrice = product.discount
        ? product.price - (product.price * product.discount) / 100
        : product.price;

    const handleNavigate = () => navigate(`/products/${product.id}`);

    const handleWishlist = e => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        dispatch(toggleWishlist(product));
        setWishlistMsg(inWishlist ? 'Removed from Wishlist' : 'Added to Wishlist!');
        setTimeout(() => setWishlistMsg(''), 1800);
    };

    const handleAddToCart = e => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
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
            className="group relative bg-white cursor-pointer overflow-hidden hover:shadow-sm transition"
            style={{ userSelect: 'none' }}
        >
            {/* IMAGE */}
            <div className="relative bg-[#f5f5f6] overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <img
                    src={product.image || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Mobile Wishlist Button */}
                <button
                    onClick={handleWishlist}
                    className="
    absolute top-2 right-2 z-10
    bg-white/90 backdrop-blur-sm
    rounded-full p-2 shadow-sm

    sm:hidden   /* ✅ only small screens */

    active:scale-90 transition
  "
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={inWishlist ? '#ff3f6c' : 'none'}
                        stroke={inWishlist ? '#ff3f6c' : '#282c3f'}
                        strokeWidth="2"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>

                {/* Discount badge */}
                {product.discount > 0 && (
                    <span className="absolute top-0 left-0 bg-[#ff905a] text-white text-[13px] font-bold px-2 py-1">
                        {product.discount}% OFF
                    </span>
                )}

                {/* Rating badge */}
                {product.reviewCount > 0 && (
                    <div className="absolute bottom-2 left-2 bg-white px-2 py-1 flex items-center gap-1 text-[12px] font-semibold rounded shadow-sm">
                        <span className="text-[#282c3f]">{product.averageRating}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#14958f">
                            <polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9" />
                        </svg>
                        <span className="text-[#94969f]">|</span>
                        <span className="text-[#94969f]">{product.reviewCount}</span>
                    </div>
                )}

                {/* Out of stock / unavailable overlay */}
                {(!inStock || !isActive) && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="text-[13px] font-bold border border-[#94969f] px-3 py-1 bg-white text-[#535766]">
                            {!inStock ? 'OUT OF STOCK' : 'UNAVAILABLE'}
                        </span>
                    </div>
                )}

                {/* Hover panel — wishlist + cart */}
                {inStock && isActive && (
                    <div className="hidden sm:block absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        {' '}
                        <div className="bg-white border-t border-[#eaeaec] p-2 space-y-1.5">
                            {/* Wishlist button */}
                            <button
                                onClick={handleWishlist}
                                className={`w-full text-[13px] font-bold py-2 flex items-center justify-center gap-1.5 transition-colors ${
                                    inWishlist
                                        ? 'bg-gray-700 text-white'
                                        : 'border border-[#d4d5d9] text-[#282c3f] hover:border-gray-600'
                                }`}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill={inWishlist ? '#ff3f6c' : 'none'}
                                    stroke={inWishlist ? '#ff3f6c' : '#282c3f'}
                                    strokeWidth="2"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {inWishlist ? 'WISHLISTED' : 'WISHLIST'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* INFO */}
            <div className="px-0 pt-2.5 pb-1.5">
                {/* Slide animation: name/brand → size hint on hover */}
                <div className="relative overflow-hidden min-h-[2.6rem]">
                    {/* Normal */}
                    <div className="transition-all duration-200 group-hover:opacity-0 group-hover:-translate-y-2">
                        <p className="text-[14px] font-bold text-[#282c3f] truncate leading-tight">
                            {product.subCategory?.category?.name || 'Brand'}
                        </p>
                        <p className="text-[13px] text-[#535766] truncate leading-tight mt-0.5">
                            {product.name}
                        </p>
                    </div>

                    {/* Hover */}
                    <div className="absolute inset-0 flex items-center opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
                        <p className="text-[13px] text-[#535766]">
                            {product.sizes?.length
                                ? `Sizes: ${product.sizes.join(', ')}`
                                : 'Sizes: One Size'}
                        </p>
                    </div>
                </div>

                {/* Price row */}
                <div className="flex flex-wrap items-center gap-x-1.5 mt-1">
                    <span className="text-[14px] font-bold text-[#282c3f]">
                        {formatPrice(discountedPrice)}
                    </span>
                    {product.discount > 0 && (
                        <>
                            <span className="text-[12px] line-through text-[#94969f]">
                                {formatPrice(product.price)}
                            </span>
                            <span className="text-[12px] text-[#ff905a] font-semibold whitespace-nowrap">
                                ({product.discount}% OFF)
                            </span>
                        </>
                    )}
                </div>

                {wishlistMsg && (
                    <p className="text-[12px] text-[#ff3f6c] mt-0.5 font-semibold">{wishlistMsg}</p>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
