import { useEffect } from 'react';

const MoveToWishlistToast = ({ item, onMoveToWishlist, onDiscard, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);

    if (!item) return null;

    const discounted = item.discount ? item.price - (item.price * item.discount) / 100 : item.price;

    const formatPrice = price =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);

    return (
        <div className="fixed bottom-0 sm:bottom-6 left-0 sm:left-1/2 sm:-translate-x-1/2 z-50 w-full sm:w-[90vw] sm:max-w-sm animate-fade-up">
            <div className="bg-white sm:rounded shadow-2xl border border-brand-border overflow-hidden">
                {/* Progress bar */}
                <div className="h-0.5 bg-brand-border">
                    <div className="h-full bg-primary animate-[shrink_5s_linear_forwards]" />
                </div>

                <div className="p-3 sm:p-4 flex items-start gap-3">
                    {/* Image */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-brand-light rounded overflow-hidden">
                        <img
                            src={item.image || '/placeholder.png'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs text-brand-gray font-medium">
                            Item removed from bag
                        </p>

                        <p className="text-xs sm:text-sm font-bold text-brand-dark truncate mt-0.5">
                            {item.name}
                        </p>

                        <p className="text-xs font-bold text-primary mt-0.5">
                            {formatPrice(discounted)}
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-2 mt-2 sm:mt-3">
                            <button
                                onClick={onMoveToWishlist}
                                className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-[11px] sm:text-xs font-bold py-2 rounded-sm"
                            >
                                <span>
                                    <svg
                                        width="11"
                                        height="11"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </span>
                                <span className="hidden xs:inline">SAVE</span>
                                <span className="hidden sm:inline"> TO WISHLIST</span>
                            </button>

                            <button
                                onClick={onDiscard}
                                className="px-2 sm:px-3 text-[11px] sm:text-xs font-bold text-brand-gray border border-brand-border rounded-sm"
                            >
                                DISCARD
                            </button>
                        </div>
                    </div>

                    {/* Close */}
                    <button onClick={onClose} className="flex-shrink-0 text-brand-gray mt-0.5">
                        ✕
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
};

export default MoveToWishlistToast;
