import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
    validateCoupon,
    removeCoupon,
    clearCouponError,
    fetchAvailableCoupons,
    selectAppliedCoupon,
    selectCouponDiscount,
    selectCouponValidating,
    selectCouponError,
    selectAvailableCoupons,
} from '../redux/slices/couponSlice';
import { selectCartItems } from '../redux/slices/cartSlice';
const formatPrice = price =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);

const CouponBox = () => {
    const dispatch = useAppDispatch();

    const appliedCoupon = useAppSelector(selectAppliedCoupon);
    const discountAmount = useAppSelector(selectCouponDiscount);
    const validating = useAppSelector(selectCouponValidating);
    const error = useAppSelector(selectCouponError);
    const availableCoupons = useAppSelector(selectAvailableCoupons);

    const [code, setCode] = useState('');
    const [showAvailable, setShowAvailable] = useState(false);
    const cartItems = useAppSelector(selectCartItems);

    // Load available coupons when box mounts
    useEffect(() => {
        if (!appliedCoupon) return;

        const timer = setTimeout(() => {
            dispatch(validateCoupon(appliedCoupon.code));
        }, 300);

        return () => clearTimeout(timer);
    }, [cartItems]);

    useEffect(() => {
        dispatch(fetchAvailableCoupons());
    }, [dispatch]);

    const handleApply = () => {
        if (!code.trim()) return;
        dispatch(validateCoupon(code.trim()));
    };

    const handleRemove = () => {
        dispatch(removeCoupon());
        setCode('');
    };

    const handleQuickApply = couponCode => {
        setCode(couponCode);
        dispatch(validateCoupon(couponCode));
        setShowAvailable(false);
    };

    const handleInputChange = e => {
        setCode(e.target.value.toUpperCase());
        if (error) dispatch(clearCouponError());
    };

    return (
        <div className="border border-brand-border rounded bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-border">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff3f6c"
                    strokeWidth="2"
                >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span className="text-sm font-extrabold text-brand-dark uppercase tracking-wider">
                    Apply Coupon
                </span>
            </div>

            <div className="p-4">
                {/* Applied coupon banner */}
                {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2.5 mb-3">
                        <div className="flex items-center gap-2">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#16a34a"
                                strokeWidth="2.5"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div>
                                <p className="text-xs font-extrabold text-green-700 uppercase tracking-wider">
                                    {appliedCoupon.code}
                                </p>
                                <p className="text-[11px] text-green-600">
                                    {appliedCoupon.discountPct}% off on {appliedCoupon.categoryName}{' '}
                                    items — saving <strong>{formatPrice(discountAmount)}</strong>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="text-xs text-red-500 hover:text-red-700 font-bold ml-2 flex-shrink-0"
                        >
                            REMOVE
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Input row */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={code}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleApply()}
                                placeholder="Enter coupon code"
                                className={`flex-1 border rounded px-3 py-2 text-sm font-mono uppercase tracking-widest outline-none transition-colors ${
                                    error
                                        ? 'border-red-400 focus:border-red-500'
                                        : 'border-brand-border focus:border-primary'
                                }`}
                            />
                            <button
                                onClick={handleApply}
                                disabled={validating || !code.trim()}
                                className="px-4 py-2 bg-primary text-white text-xs font-extrabold tracking-wider hover:bg-primary-hover transition-colors rounded disabled:opacity-50 whitespace-nowrap"
                            >
                                {validating ? (
                                    <svg
                                        className="animate-spin w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="white"
                                            strokeWidth="3"
                                            strokeDasharray="32"
                                            strokeDashoffset="10"
                                        />
                                    </svg>
                                ) : (
                                    'APPLY'
                                )}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="mt-1.5 text-xs text-red-500 font-semibold">{error}</p>
                        )}

                        {/* Available coupons toggle */}
                        {availableCoupons.length > 0 && (
                            <div className="mt-3">
                                <button
                                    onClick={() => setShowAvailable(v => !v)}
                                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <polyline
                                            points={
                                                showAvailable ? '18 15 12 9 6 15' : '6 9 12 15 18 9'
                                            }
                                        />
                                    </svg>
                                    {showAvailable ? 'Hide' : 'View'} available coupons (
                                    {availableCoupons.length})
                                </button>

                                {showAvailable && (
                                    <div className="mt-2 space-y-2">
                                        {availableCoupons.map(c => (
                                            <div
                                                key={c.id}
                                                className="flex items-center justify-between border border-dashed border-green-300 rounded px-3 py-2 bg-green-50"
                                            >
                                                <div>
                                                    <p className="text-xs font-extrabold text-brand-dark font-mono uppercase">
                                                        {c.code}
                                                    </p>
                                                    <p className="text-[11px] text-brand-gray">
                                                        {c.discountPct}% off on {c.categoryName}
                                                        {c.expiresAt && (
                                                            <span className="ml-1 text-orange-500">
                                                                · Expires{' '}
                                                                {new Date(
                                                                    c.expiresAt,
                                                                ).toLocaleDateString('en-IN')}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleQuickApply(c.code)}
                                                    className="text-xs font-extrabold text-primary hover:underline ml-3 flex-shrink-0"
                                                >
                                                    APPLY
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CouponBox;
