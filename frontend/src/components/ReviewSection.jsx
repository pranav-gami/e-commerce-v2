import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAppSelector } from "../redux/hooks";
import { selectUser } from "../redux/slices/authSlice";

// ─── Star primitives ─────────────────────────────────────────────────────────

const StarIcon = ({
  filled,
  half,
  size = 16,
  interactive = false,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    onClick={onClick}
    style={interactive ? { cursor: "pointer" } : {}}
  >
    {half ? (
      <>
        <defs>
          <linearGradient id="half-grad">
            <stop offset="50%" stopColor="#ff3f6c" />
            <stop offset="50%" stopColor="#dee2e6" />
          </linearGradient>
        </defs>
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="url(#half-grad)"
          stroke="none"
        />
      </>
    ) : (
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? "#ff3f6c" : "#dee2e6"}
        stroke="none"
      />
    )}
  </svg>
);

const Stars = ({ rating, size = 16 }) => {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          filled={i < full}
          half={i === full && hasHalf}
          size={size}
        />
      ))}
    </span>
  );
};

const InteractiveStars = ({ value, onChange, size = 24 }) => {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        return (
          <StarIcon
            key={i}
            filled={star <= (hover || value)}
            size={size}
            interactive
            onClick={() => onChange(star)}
          />
        );
      }).map((el, i) => (
        // wrap each in a span for hover tracking
        <span
          key={i}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          {el}
        </span>
      ))}
    </span>
  );
};

// ─── Avatar helper ────────────────────────────────────────────────────────────

const Avatar = ({ name }) => {
  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  // deterministic colour from name
  const colours = [
    "#ff3f6c",
    "#14958f",
    "#f05c00",
    "#7c3aed",
    "#0891b2",
    "#d97706",
  ];
  const idx = name ? name.charCodeAt(0) % colours.length : 0;
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
      style={{ background: colours[idx] }}
    >
      {initials}
    </div>
  );
};

// ─── Rating Bar ───────────────────────────────────────────────────────────────

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs text-brand-gray">
      <span className="w-6 text-right font-semibold shrink-0">{star}★</span>
      <div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right shrink-0">{count}</span>
    </div>
  );
};

// ─── Review Form ──────────────────────────────────────────────────────────────

const ReviewForm = ({ productId, userOrders, onSuccess, onClose }) => {
  const [orderId, setOrderId] = useState(userOrders[0]?.id || "");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating) return setError("Please select a star rating.");
    if (!orderId) return setError("Please select an order.");
    setError("");
    setLoading(true);
    try {
      await api.post("/reviews", {
        productId,
        orderId: Number(orderId),
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit review. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-brand-border rounded-lg p-6 bg-brand-light mb-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-extrabold text-brand-dark uppercase tracking-wider">
          Write a Review
        </h3>
        <button
          onClick={onClose}
          className="text-brand-gray hover:text-brand-dark transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Order selector */}
      {userOrders.length > 1 && (
        <div className="mb-4">
          <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1 block">
            Select Order
          </label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full border border-brand-border rounded px-3 py-2 text-sm text-brand-dark bg-white focus:outline-none focus:border-primary"
          >
            {userOrders.map((o) => (
              <option key={o.id} value={o.id}>
                Order #{o.id} —{" "}
                {new Date(o.createdAt).toLocaleDateString("en-IN")}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Star rating */}
      <div className="mb-4">
        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2 block">
          Your Rating
        </label>
        <div className="flex items-center gap-3">
          <InteractiveStars value={rating} onChange={setRating} size={28} />
          {rating > 0 && (
            <span className="text-sm font-semibold text-brand-dark">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1 block">
          Review Title{" "}
          <span className="text-brand-gray font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Summarise your experience…"
          className="w-full border border-brand-border rounded px-3 py-2 text-sm text-brand-dark bg-white placeholder-brand-gray focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1 block">
          Detailed Review{" "}
          <span className="text-brand-gray font-normal">(optional)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Tell others what you think about this product…"
          className="w-full border border-brand-border rounded px-3 py-2 text-sm text-brand-dark bg-white placeholder-brand-gray focus:outline-none focus:border-primary transition-colors resize-none"
        />
        <p className="text-[10px] text-brand-gray text-right mt-0.5">
          {body.length}/1000
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded mb-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading || !rating}
          className="flex-1 bg-primary text-white text-sm font-extrabold py-2.5 rounded-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
        >
          {loading ? "Submitting…" : "SUBMIT REVIEW"}
        </button>
        <button
          onClick={onClose}
          className="px-5 border border-brand-border text-brand-muted text-sm font-bold py-2.5 rounded-sm hover:border-brand-dark transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Single Review Card ───────────────────────────────────────────────────────

const ReviewCard = ({ review, currentUserId, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Delete your review?")) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${review.id}`);
      onDelete(review.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="border border-brand-border rounded-lg p-5 bg-white hover:border-brand-muted transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={review.user?.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-brand-dark">
              {review.user?.name || "Customer"}
            </span>
            {review.verified && (
              <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">
                ✓ Verified Purchase
              </span>
            )}
            {review.user?.id === currentUserId && (
              <span className="text-[10px] text-primary font-semibold bg-red-50 px-1.5 py-0.5 rounded-full">
                Your Review
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rating={review.rating} />
            <span className="text-xs text-brand-gray">
              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        {review.user?.id === currentUserId && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-brand-gray hover:text-red-500 transition-colors font-semibold shrink-0 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        )}
      </div>

      {review.title && (
        <h4 className="text-sm font-bold text-brand-dark mb-1">
          {review.title}
        </h4>
      )}
      {review.body && (
        <p className="text-sm text-brand-muted leading-relaxed">
          {review.body}
        </p>
      )}
    </div>
  );
};

// ─── Main ReviewSection Component ────────────────────────────────────────────

/**
 * Props:
 *  - productId: number
 */
const ReviewSection = ({ productId }) => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const user = useAppSelector(selectUser);

  const [data, setData] = useState(null); // { reviews, pagination, summary }
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [userOrders, setUserOrders] = useState([]); // delivered orders with this product
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [canReview, setCanReview] = useState(false); // has ≥1 eligible order

  const LIMIT = 5;

  // ── fetch reviews ──────────────────────────────────────────────────────────
  const fetchReviews = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res = await api.get(
          `/reviews/product/${productId}?page=${p}&limit=${LIMIT}`,
        );
        setData(res.data);
      } catch {
        // keep old data
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    fetchReviews(page);
  }, [fetchReviews, page]);

  // ── check if user can review (delivered order exists) ────────────────────
  useEffect(() => {
    if (!user) return;
    const checkEligibility = async () => {
      setOrdersLoading(true);
      try {
        // fetch user's delivered orders that contain this product
        const res = await api.get(`/orders/my-orders?status=DELIVERED`);
        const orders = res.data?.data?.orders || res.data?.orders || [];
        const eligible = orders.filter((o) =>
          o.orderItems?.some(
            (item) =>
              (item.productId || item.product?.id) === Number(productId),
          ),
        );
        setUserOrders(eligible);
        setCanReview(eligible.length > 0);
      } catch {
        // fallback: allow form — API will reject if ineligible
        setCanReview(false);
      } finally {
        setOrdersLoading(false);
      }
    };
    checkEligibility();
  }, [user, productId]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleReviewSuccess = () => {
    setShowForm(false);
    setPage(1);
    fetchReviews(1);
  };

  const handleDelete = (deletedId) => {
    setData((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((r) => r.id !== deletedId),
      summary: {
        ...prev.summary,
        totalReviews: prev.summary.totalReviews - 1,
      },
      pagination: {
        ...prev.pagination,
        total: prev.pagination.total - 1,
      },
    }));
  };

  const handleWriteReview = () => {
    if (!user) return navigate("/login");
    setShowForm(true);
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const summary = data?.summary;
  const reviews = data?.reviews || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div>
      {/* ── Summary Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-brand-light rounded-lg">
        {/* Big number */}
        <div className="flex flex-col items-center justify-center text-center min-w-[120px]">
          <span className="text-5xl font-extrabold text-brand-dark leading-none">
            {loading && !summary
              ? "—"
              : (summary?.averageRating ?? 0).toFixed(1)}
          </span>
          <Stars rating={summary?.averageRating ?? 0} size={18} />
          <p className="text-xs text-brand-gray mt-1.5">
            {summary?.totalReviews ?? 0} review
            {(summary?.totalReviews ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Bar breakdown */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar
              key={star}
              star={star}
              count={summary?.ratingBreakdown?.[star] ?? 0}
              total={summary?.totalReviews ?? 0}
            />
          ))}
        </div>

        {/* Write review CTA */}
        <div className="flex flex-col items-center justify-center gap-3 min-w-[160px]">
          {!showForm && (
            <>
              {user ? (
                canReview ? (
                  <button
                    onClick={handleWriteReview}
                    className="w-full bg-primary text-white text-xs font-extrabold py-2.5 px-5 rounded-sm hover:bg-primary-hover transition-colors tracking-wider"
                  >
                    WRITE A REVIEW
                  </button>
                ) : ordersLoading ? (
                  <p className="text-xs text-brand-gray text-center">
                    Checking eligibility…
                  </p>
                ) : (
                  <p className="text-xs text-brand-gray text-center leading-relaxed">
                    Purchase &amp; receive this product to leave a review.
                  </p>
                )
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full border-2 border-primary text-primary text-xs font-extrabold py-2.5 px-5 rounded-sm hover:bg-primary-light transition-colors tracking-wider"
                >
                  LOGIN TO REVIEW
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Review Form ────────────────────────────────────────────────────── */}
      {showForm && (
        <ReviewForm
          productId={productId}
          userOrders={userOrders}
          onSuccess={handleReviewSuccess}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ── Review List ────────────────────────────────────────────────────── */}
      {loading && reviews.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-brand-gray">
          <p className="text-3xl mb-2">✍️</p>
          <p className="text-sm font-semibold">No reviews yet.</p>
          <p className="text-xs mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              currentUserId={user?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-xs font-bold border border-brand-border rounded-sm text-brand-muted hover:border-brand-dark hover:text-brand-dark transition-colors disabled:opacity-40"
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
            )
            .reduce((acc, n, i, arr) => {
              if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
              acc.push(n);
              return acc;
            }, [])
            .map((item, i) =>
              item === "…" ? (
                <span key={`dot-${i}`} className="text-xs text-brand-gray px-1">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  disabled={loading}
                  className={`w-8 h-8 text-xs font-bold rounded-sm transition-colors ${
                    page === item
                      ? "bg-primary text-white"
                      : "border border-brand-border text-brand-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 text-xs font-bold border border-brand-border rounded-sm text-brand-muted hover:border-brand-dark hover:text-brand-dark transition-colors disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
