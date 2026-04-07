import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
    selectWishlistItems,
    removeFromWishlist,
    clearWishlist,
} from '../redux/slices/wishlistSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { selectUser } from '../redux/slices/authSlice';

const WishlistPage = () => {
    const dispatch = useAppDispatch();
    const wishlistItems = useAppSelector(selectWishlistItems);
    const user = useAppSelector(selectUser);
    const navigate = useNavigate();
    const [addingId, setAddingId] = useState(null);
    const [movedId, setMovedId] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        document.title = 'Wishlist';
        // Allow Redux rehydration/persistence to settle before rendering
        const t = setTimeout(() => setPageLoading(false), 300);
        return () => clearTimeout(t);
    }, []);

    const formatPrice = price =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);

    const handleMoveToCart = async (e, product) => {
        e.stopPropagation();
        if (!user) return navigate('/login');
        try {
            setAddingId(product.id);
            await dispatch(addToCart(product)).unwrap();
            setMovedId(product.id);
            setTimeout(() => {
                dispatch(removeFromWishlist(product.id));
                setMovedId(null);
            }, 800);
        } catch (err) {
            console.error(err);
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-brand-light">
            <div className="bg-white border-b border-brand-border">
                <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold text-brand-dark">My Wishlist</h1>
                        <p className="text-sm text-brand-gray mt-0.5">
                            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}{' '}
                            saved
                        </p>
                    </div>
                    {wishlistItems.length > 0 && (
                        <button
                            onClick={() => dispatch(clearWishlist())}
                            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors border border-red-200 px-3 py-1.5 rounded hover:bg-red-50"
                        >
                            CLEAR ALL
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 py-8">
                {pageLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white border border-brand-border overflow-hidden">
                                <div className="aspect-[3/4] bg-[#f5f5f6] animate-pulse" />
                                <div className="p-3 space-y-2">
                                    <div className="h-2.5 bg-[#f5f5f6] animate-pulse rounded w-2/3" />
                                    <div className="h-3 bg-[#f5f5f6] animate-pulse rounded w-full" />
                                    <div className="h-3 bg-[#f5f5f6] animate-pulse rounded w-3/4" />
                                    <div className="h-8 bg-[#f5f5f6] animate-pulse rounded mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded shadow-sm">
                        <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mb-5">
                            <svg
                                width="36"
                                height="36"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ff3f6c"
                                strokeWidth="1.5"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-extrabold text-brand-dark">
                            Your wishlist is empty
                        </h2>
                        <p className="text-brand-gray mt-1 text-sm">
                            Save items you love by clicking the heart icon.
                        </p>
                        <Link
                            to="/products"
                            className="mt-6 bg-primary text-white px-8 py-3 text-sm font-bold hover:bg-primary-hover transition-colors rounded-sm tracking-wider"
                        >
                            START EXPLORING
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {wishlistItems.map(product => {
                            const discounted = product.discount
                                ? product.price - (product.price * product.discount) / 100
                                : product.price;
                            const inStock = product.stock > 0;
                            const isMoved = movedId === product.id;
                            const status = product.status;
                            return (
                                <div
                                    key={product.id}
                                    className={`group bg-white border border-brand-border overflow-hidden hover:shadow-md transition-all duration-300 relative ${isMoved ? 'opacity-50 scale-95' : ''}`}
                                >
                                    <button
                                        onClick={() => dispatch(removeFromWishlist(product.id))}
                                        className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                                        title="Remove from wishlist"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="#ff3f6c"
                                            stroke="#ff3f6c"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>

                                    <div
                                        onClick={e => {
                                            e.stopPropagation();
                                            navigate(`/products/${product.id}`);
                                        }}
                                        className="relative overflow-hidden aspect-[3/4] bg-brand-light cursor-pointer"
                                    >
                                        <img
                                            src={product.image || '/placeholder.png'}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {product.discount > 0 && (
                                            <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
                                                {product.discount}% OFF
                                            </span>
                                        )}
                                        {!inStock && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="text-xs font-bold text-brand-gray border border-brand-border px-3 py-1 bg-white rounded-sm">
                                                    OUT OF STOCK
                                                </span>
                                            </div>
                                        )}
                                        {status !== 'ACTIVE' && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="text-xs font-bold text-brand-gray border border-brand-border px-3 py-1 bg-white rounded-sm">
                                                    Product is not Available
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3">
                                        <p className="text-[11px] font-bold text-brand-dark uppercase tracking-wide truncate">
                                            {product.subCategory?.category?.name || 'Brand'}
                                        </p>
                                        <p className="text-sm text-brand-gray line-clamp-2 mt-0.5">
                                            {product.name}
                                        </p>
                                        <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                                            <span className="text-sm font-bold text-brand-dark">
                                                {formatPrice(discounted)}
                                            </span>
                                            {product.discount > 0 && (
                                                <span className="text-xs text-brand-gray line-through">
                                                    {formatPrice(product.price)}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={e => handleMoveToCart(e, product)}
                                            disabled={
                                                !inStock ||
                                                addingId === product.id ||
                                                isMoved ||
                                                status !== 'ACTIVE'
                                            }
                                            className="w-full mt-2.5 flex items-center justify-center gap-2 bg-primary text-white text-xs font-extrabold py-2.5 rounded-sm hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
                                        >
                                            {addingId === product.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : isMoved ? (
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="white"
                                                    strokeWidth="3"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="white"
                                                    strokeWidth="2.5"
                                                >
                                                    <circle cx="9" cy="21" r="1" />
                                                    <circle cx="20" cy="21" r="1" />
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                                </svg>
                                            )}
                                            {isMoved
                                                ? 'MOVED!'
                                                : addingId === product.id
                                                    ? 'MOVING...'
                                                    : inStock
                                                        ? 'MOVE TO BAG'
                                                        : 'OUT OF STOCK'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


export default WishlistPage;
