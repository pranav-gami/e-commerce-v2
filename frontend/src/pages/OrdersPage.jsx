import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../utils/api";

const LIMIT = 5;

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    classes: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    classes: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  SHIPPED: {
    label: "Shipped",
    classes: "bg-purple-100 text-purple-700 border border-purple-200",
  },
  DELIVERED: {
    label: "Delivered",
    classes: "bg-green-100 text-green-700 border border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-red-100 text-red-600 border border-red-200",
  },
};

const getDisplayStatus = (order) => {
  if (order.status === "CANCELLED") {
    if (order.payment?.status === "REFUNDED")
      return {
        label: "Refunded",
        classes: "bg-teal-100 text-teal-700 border border-teal-200",
      };
    if (order.payment?.status === "PARTIALLY_REFUNDED")
      return {
        label: "Refund in Process...",
        classes: "bg-teal-100 text-teal-700 border border-teal-200",
      };
    if (order.payment?.status === "SUCCESS")
      return {
        label: "Refund in Process",
        classes: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      };
    return {
      label: "Cancellation requested",
      classes: "bg-orange-100 text-orange-700 border border-orange-200",
    };
  }
  return (
    STATUS_CONFIG[order.status] || {
      label: order.status,
      classes: "bg-brand-light text-brand-gray",
    }
  );
};

const STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const Pagination = ({ pagination, page, onPage }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { totalPages, hasNextPage, hasPrevPage } = pagination;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPage(page - 1)}
        disabled={!hasPrevPage}
        className="w-9 h-9 flex items-center justify-center border border-brand-border rounded text-brand-gray hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            className="w-9 h-9 flex items-center justify-center text-brand-gray text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 flex items-center justify-center border rounded text-sm font-bold transition-colors ${
              p === page
                ? "bg-primary text-white border-primary"
                : "border-brand-border text-brand-dark hover:border-primary hover:text-primary"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasNextPage}
        className="w-9 h-9 flex items-center justify-center border border-brand-border rounded text-brand-gray hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

const OrdersPage = () => {
  const { getOrders, cancelOrder } = useAuth();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    document.title = "My Orders";
  }, []);

  const fetchOrders = async (p = page, status = activeStatus) => {
    try {
      setLoading(true);
      setError("");
      const data = await getOrders({
        page: p,
        limit: LIMIT,
        status: status || undefined,
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError("Failed to load orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, activeStatus);
  }, []);

  const handleTabChange = (status) => {
    setActiveStatus(status);
    setPage(1);
    fetchOrders(1, status);
  };

  const handlePage = (p) => {
    setPage(p);
    fetchOrders(p, activeStatus);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingId(orderId);
      setConfirmCancelId(null);
      setError("");
      await cancelOrder(orderId);
      setSuccessMessage(
        "Cancellation requested. Refund will be processed shortly.",
      );
      setTimeout(() => setSuccessMessage(""), 5000);
      await fetchOrders(page, activeStatus);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(p);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const canCancel = (status) => status === "PENDING" || status === "CONFIRMED";

  return (
    <div className="min-h-screen bg-brand-light py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-dark">
              My Orders
            </h1>
            {pagination && (
              <p className="text-sm text-brand-gray mt-0.5">
                {pagination.total} order{pagination.total !== 1 ? "s" : ""}{" "}
                found
              </p>
            )}
          </div>
          <Link
            to="/products"
            className="text-sm font-bold text-primary border border-primary px-4 py-2 rounded hover:bg-primary-light transition-colors"
          >
            + Shop More
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-extrabold rounded-full border transition-colors ${
                activeStatus === tab.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-brand-gray border-brand-border hover:border-primary hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded mb-5 font-medium">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded mb-5 font-medium flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded border border-brand-border h-48 animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded border border-brand-border shadow-sm flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mb-5">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94969f"
                strokeWidth="1.2"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-brand-dark">
              {activeStatus
                ? `No ${activeStatus.toLowerCase()} orders`
                : "No orders yet"}
            </h3>
            <p className="text-brand-gray text-sm mt-1">
              {activeStatus
                ? "Try a different status filter."
                : "Looks like you haven't placed any orders."}
            </p>
            <Link
              to="/products"
              className="mt-6 bg-primary text-white px-8 py-3 text-sm font-bold hover:bg-primary-hover transition-colors rounded-sm tracking-wider"
            >
              START SHOPPING
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {orders.map((order) => {
                const statusCfg = getDisplayStatus(order);
                const stepIdx = STEPS.indexOf(order.status);

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-brand-border rounded shadow-sm overflow-hidden"
                  >
                    {/* Order header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-light flex-wrap gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="text-[11px] font-extrabold text-brand-gray uppercase tracking-wider">
                            Order ID
                          </p>
                          <p className="text-sm font-bold text-brand-dark">
                            #{order.id}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-brand-border hidden sm:block" />
                        <div>
                          <p className="text-[11px] font-extrabold text-brand-gray uppercase tracking-wider">
                            Placed On
                          </p>
                          <p className="text-sm font-bold text-brand-dark">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-brand-border hidden sm:block" />
                        <div>
                          <p className="text-[11px] font-extrabold text-brand-gray uppercase tracking-wider">
                            Total
                          </p>
                          <p className="text-sm font-bold text-brand-dark">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`text-xs font-extrabold px-3 py-1 rounded-full tracking-wide ${statusCfg.classes}`}
                        >
                          {statusCfg.label}
                        </span>
                        {canCancel(order.status) && (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={cancellingId === order.id}
                            className="text-xs font-bold text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === order.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress tracker */}
                    {order.status !== "CANCELLED" && (
                      <div className="px-5 py-4 border-b border-brand-border">
                        <div className="flex items-center">
                          {STEPS.map((step, i) => (
                            <div
                              key={step}
                              className="flex items-center flex-1 last:flex-none"
                            >
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                                    i <= stepIdx
                                      ? "bg-primary text-white"
                                      : "bg-brand-border text-brand-gray"
                                  }`}
                                >
                                  {i < stepIdx ? (
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
                                    i + 1
                                  )}
                                </div>
                                <p
                                  className={`text-[10px] font-bold mt-1 whitespace-nowrap ${i <= stepIdx ? "text-primary" : "text-brand-gray"}`}
                                >
                                  {step.charAt(0) + step.slice(1).toLowerCase()}
                                </p>
                              </div>
                              {i < STEPS.length - 1 && (
                                <div
                                  className={`flex-1 h-0.5 mx-1 mb-4 ${i < stepIdx ? "bg-primary" : "bg-brand-border"}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order items */}
                    <div className="divide-y divide-brand-border">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 px-5 py-4"
                        >
                          <div className="w-16 h-16 flex-shrink-0 bg-brand-light rounded overflow-hidden">
                            <img
                              src={
                                item.product.image
                                  ? `${BACKEND_URL}${item.product.image}`
                                  : "/placeholder.png"
                              }
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-brand-dark truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-brand-gray mt-0.5">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-xs font-semibold text-brand-muted mt-0.5">
                              {formatPrice(item.price)} each
                            </p>
                          </div>
                          <p className="text-sm font-extrabold text-brand-dark flex-shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Refund bar */}
                    {order.status === "CANCELLED" && (
                      <div className="flex items-center gap-2 px-5 py-3 bg-teal-50 border-t border-teal-100 text-sm text-teal-700 font-medium">
                        {order.payment?.status === "REFUNDED" ? (
                          <span>
                            Refund of{" "}
                            <strong>{formatPrice(order.total)}</strong>{" "}
                            completed.
                          </span>
                        ) : order.payment?.status === "SUCCESS" ? (
                          <span>
                            Refund of{" "}
                            <strong>{formatPrice(order.total)}</strong> is being
                            processed. Expected in 5–7 business days.
                          </span>
                        ) : (
                          <span>Order cancelled successfully.</span>
                        )}
                      </div>
                    )}

                    {/* Order footer */}
                    <div className="flex items-center justify-between px-5 py-3 bg-brand-light border-t border-brand-border">
                      <div className="flex items-center gap-2 text-xs text-brand-gray">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="1" y="3" width="15" height="13" />
                          <path d="M16 8h4l3 3v5h-7V8z" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        <span className="font-semibold">Free Delivery</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-brand-gray font-medium">
                          Order Total:
                        </span>
                        <span className="font-extrabold text-brand-dark">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <Pagination
              pagination={pagination}
              page={page}
              onPage={handlePage}
            />

            {pagination && (
              <p className="text-center text-xs text-brand-gray mt-3">
                Showing {(page - 1) * LIMIT + 1}–
                {Math.min(page * LIMIT, pagination.total)} of {pagination.total}{" "}
                orders
              </p>
            )}
          </>
        )}
      </div>

      {/* Cancel confirm modal */}
      {confirmCancelId && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={() => setConfirmCancelId(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm bg-white rounded shadow-2xl overflow-hidden">
            <div className="h-1 bg-red-500" />
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-brand-dark">
                Cancel Order?
              </h3>
              <p className="text-sm text-brand-gray mt-2 leading-relaxed">
                Are you sure you want to cancel this order? If paid, refund will
                be credited in 5–7 business days.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmCancelId(null)}
                  className="flex-1 border border-brand-border text-brand-dark font-bold text-sm py-2.5 rounded hover:bg-brand-light transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => handleCancelOrder(confirmCancelId)}
                  disabled={cancellingId === confirmCancelId}
                  className="flex-1 bg-red-500 text-white font-bold text-sm py-2.5 rounded hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancellingId === confirmCancelId ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersPage;
