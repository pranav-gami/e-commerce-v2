import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./OrdersPage.css";
import { BACKEND_URL } from "../utils/api";

const OrdersPage = () => {
  const { getOrders, cancelOrder } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      console.log("Orders data:", data);

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data?.orders)) {
        setOrders(data.orders);
      } else if (Array.isArray(data?.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError("Failed to load orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      setCancellingId(orderId);
      setError("");

      const response = await cancelOrder(orderId);

      // ✅ Show different message based on refund or not
      if (response?.refunded) {
        setSuccessMessage(
          "Order cancelled! Refund of will be credited in 5-7 business days.",
        );
      } else {
        setSuccessMessage("Order cancelled successfully!");
      }

      setTimeout(() => setSuccessMessage(""), 5000);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ Fix 1: Add REFUNDED status color
  const getStatusColor = (status) => {
    const map = {
      PENDING: "status-pending",
      CONFIRMED: "status-confirmed",
      SHIPPED: "status-shipped",
      DELIVERED: "status-delivered",
      CANCELLED: "status-cancelled",
      REFUNDED: "status-refunded", // ← add this
    };
    return map[status] || "";
  };

  // ✅ Fix 2: Add REFUNDED status label with emoji
  const getStatusLabel = (status) => {
    const map = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
      REFUNDED: " Refunded", // ← add this
    };
    return map[status] || status;
  };

  // ✅ Fix 3: REFUNDED orders cannot be cancelled again
  const canCancel = (status) => status === "PENDING" || status === "CONFIRMED";

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-loading">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="order-skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>
            {orders.length} order{orders.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMessage && <div className="auth-success">{successMessage}</div>}

        {orders.length === 0 ? (
          <div className="orders-empty">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M9 2L7.17 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4.17L15 2H9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <h3>No orders yet</h3>
            <p>Looks like you haven't placed any orders.</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-meta">
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="order-header-right">
                    {/* ✅ Fix 4: Use getStatusLabel for emoji + text */}
                    <span
                      className={`order-status ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>

                    {/* ✅ Fix 5: Show cancel button only for PENDING/CONFIRMED */}
                    {canCancel(order.status) && (
                      <button
                        className="btn-cancel-order"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                      >
                        {cancellingId === order.id
                          ? "Cancelling..."
                          : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <img
                        src={
                          item.product.image
                            ? `${BACKEND_URL}${item.product.image}`
                            : "/placeholder.png"
                        }
                        alt={item.product.name}
                        className="order-item-image"
                      />
                      <div className="order-item-info">
                        <h4>{item.product.name}</h4>
                        <p>Qty: {item.quantity}</p>
                        <p className="order-item-price">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="order-item-subtotal">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ Fix 7: Show refund info inside card for REFUNDED orders */}
                {order.status === "REFUNDED" && (
                  <div className="refund-info-bar">
                    <span>💸</span>
                    <span>
                      Refund of <strong>{formatPrice(order.total)}</strong> has
                      been initiated. Expected in 5-7 business days.
                    </span>
                  </div>
                )}

                {/* Order Footer */}
                <div className="order-card-footer">
                  <div className="order-delivery">
                    <svg
                      width="16"
                      height="16"
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
                    <span>Free Delivery</span>
                  </div>
                  <div className="order-total">
                    <span>Total:</span>
                    <span className="order-total-amount">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
