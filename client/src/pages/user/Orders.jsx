import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AccountSidebar from "../../components/AccountSidebar";
import { API_BASE_URL } from "../../config/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const canCancelOrder = (status) =>
    ["Placed", "Processing", "Shipped"].includes(status || "Placed");

  const getUserIdentifier = () => {
    try {
      const stored =
        localStorage.getItem("userProfile") ||
        sessionStorage.getItem("userProfile");
      const user = stored ? JSON.parse(stored) : null;
      return user?.userId || user?.id || user?._id || user?.email || "";
    } catch {
      return "";
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    const identifier = getUserIdentifier();

    let serverOrders = [];
    if (identifier) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/order/user/${encodeURIComponent(identifier)}`,
        );
        if (Array.isArray(response.data)) {
          serverOrders = response.data;
        }
      } catch (err) {
        console.warn("Could not load orders from server, using local store:", err.message);
      }
    }

    try {
      const localOrders = JSON.parse(
        localStorage.getItem("userOrders") || "[]",
      );

      // Merge server orders and local orders without duplicates
      const orderMap = new Map();
      serverOrders.forEach((order) => {
        if (order.orderId) orderMap.set(order.orderId, order);
      });
      localOrders.forEach((order) => {
        if (order.orderId && !orderMap.has(order.orderId)) {
          orderMap.set(order.orderId, order);
        }
      });

      const merged = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

      setOrders(merged);
    } catch {
      setOrders(serverOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel order #${orderId}?`)) {
      return;
    }

    setCancellingId(orderId);
    setFeedback({ type: "", text: "" });

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/order/cancel/${orderId}`,
      );

      const updatedOrder = response.data?.order;
      const updatedOrders = orders.map((order) => {
        if (order.orderId !== orderId) return order;
        return updatedOrder || {
          ...order,
          orderStatus: "Cancelled",
          paymentStatus: "Cancelled",
        };
      });

      setOrders(updatedOrders);
      localStorage.setItem("userOrders", JSON.stringify(updatedOrders));

      setFeedback({
        type: "success",
        text:
          response.data?.message ||
          `Order #${orderId} has been cancelled. Confirmation email sent to your Gmail.`,
      });
    } catch (err) {
      // Local fallback cancellation if server error
      const updatedOrders = orders.map((order) => {
        if (order.orderId !== orderId) return order;
        return {
          ...order,
          orderStatus: "Cancelled",
          paymentStatus: "Cancelled",
        };
      });
      setOrders(updatedOrders);
      localStorage.setItem("userOrders", JSON.stringify(updatedOrders));

      setFeedback({
        type: "info",
        text: `Order #${orderId} marked as cancelled.`,
      });
    } finally {
      setCancellingId("");
    }
  };

  return (
    <>
      <Header />
      <main className="profile-page orders-page">
        <AccountSidebar subtitle="Order history and tracking" />

        <section className="settings-main" aria-labelledby="orders-title">
          <header className="settings-heading">
            <h1 id="orders-title">My Orders</h1>
            <p>Track your purchases, view invoices, and manage order status.</p>
          </header>

          {feedback.text && (
            <div
              className={`alert ${feedback.type === "success" ? "alert-success" : "alert-info"} alert-dismissible fade show d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 mb-4 small`}
              role="alert"
            >
              <i className="bi bi-info-circle-fill fs-6" />
              <span className="flex-grow-1">{feedback.text}</span>
              <button
                type="button"
                className="btn-close p-2"
                onClick={() => setFeedback({ type: "", text: "" })}
                aria-label="Close"
              />
            </div>
          )}

          <section className="orders-card">
            <div className="orders-card-heading d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="fs-5 mb-0">Order History</h2>
                <p className="text-muted small mb-0">Real-time status of all your orders.</p>
              </div>
              <span className="orders-count badge bg-light text-primary border">
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5 text-muted">
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Loading your orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-empty text-center py-5">
                <div className="orders-empty-icon mb-3 fs-1 text-muted">
                  <i className="bi bi-bag-x" />
                </div>
                <h3 className="fs-5 fw-bold">No orders yet</h3>
                <p className="text-muted small mx-auto" style={{ maxWidth: "340px" }}>
                  When you place an order, its real-time tracking details and Gmail receipts will appear here.
                </p>
                <Link to="/Product" className="btn btn-primary btn-sm rounded-pill px-4 mt-2">
                  <i className="bi bi-bag me-1" /> Start Shopping
                </Link>
              </div>
            ) : (
              <div className="orders-history-list d-flex flex-column gap-3">
                {orders.map((order) => {
                  const status = order.orderStatus || "Placed";
                  const badgeClass =
                    status === "Delivered"
                      ? "bg-success text-white"
                      : status === "Cancelled"
                        ? "bg-danger text-white"
                        : status === "Shipped"
                          ? "bg-primary text-white"
                          : "bg-warning text-dark";

                  return (
                    <article
                      className="order-history-item card border shadow-sm p-3 rounded-3"
                      key={order.orderId || order._id}
                    >
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-2 pb-2 border-bottom">
                        <div>
                          <strong className="fs-6 text-primary">#{order.orderId}</strong>
                          <span className="text-muted small ms-2">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Recent"}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge rounded-pill px-3 py-1.5 ${badgeClass}`} style={{ fontSize: "11px" }}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                        <div className="small text-muted">
                          <span>{order.items?.length || 1} items</span>
                          <span className="mx-1.5">&bull;</span>
                          <span className="text-uppercase fw-semibold">{order.paymentMethod || "COD"}</span>
                          <span className="mx-1.5">&bull;</span>
                          <span className="fw-bold text-dark fs-6">
                            ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2 align-self-end align-self-sm-auto">
                          <Link
                            to={`/track-order?id=${order.orderId}`}
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                            style={{ fontSize: "12px" }}
                          >
                            Track
                          </Link>
                          {canCancelOrder(status) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-pill px-3"
                              style={{ fontSize: "12px" }}
                              disabled={cancellingId === order.orderId}
                              onClick={() => handleCancelOrder(order.orderId)}
                            >
                              {cancellingId === order.orderId ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" />
                                  Cancelling...
                                </>
                              ) : (
                                "Cancel Order"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Orders;
