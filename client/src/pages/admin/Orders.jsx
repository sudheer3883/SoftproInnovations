import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const ORDER_API = `${API_BASE_URL}/api/order`;
const ORDER_STATUSES = ["Placed", "Processing", "Shipped", "Delivered"];
const getAvailableStatuses = (currentStatus) =>
  currentStatus === "Cancelled" ? [currentStatus] : ORDER_STATUSES;
const canCancelOrder = (orderStatus) =>
  ["Placed", "Processing", "Shipped"].includes(orderStatus);

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";
const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadOrders = async () => {
    try {
      setError("");
      const response = await axios.get(`${ORDER_API}/all`);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadOrders, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateOrderStatus = async (order, orderStatus) => {
    setUpdatingId(order._id);
    try {
      const response = await axios.patch(`${ORDER_API}/status/${order._id}`, {
        orderStatus,
      });
      const updatedOrder = response.data.order;
      setOrders((current) =>
        current.map((item) =>
          item._id === updatedOrder._id ? updatedOrder : item,
        ),
      );
      setSelectedOrder((current) =>
        current?._id === updatedOrder._id ? updatedOrder : current,
      );
    } catch (updateError) {
      setError(
        updateError.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this order?")
    )
      return;
    try {
      await axios.delete(`${ORDER_API}/${orderId}`);
      setOrders((current) =>
        current.filter(
          (item) => item.orderId !== orderId && item._id !== orderId,
        ),
      );
      if (
        selectedOrder &&
        (selectedOrder.orderId === orderId || selectedOrder._id === orderId)
      ) {
        setSelectedOrder(null);
      }
    } catch (deleteError) {
      alert(deleteError.response?.data?.message || "Failed to delete order.");
    }
  };

  const handleClearAllOrders = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL orders permanently? This action cannot be undone.",
      )
    )
      return;
    try {
      await axios.delete(`${ORDER_API}/clear/all`);
      setOrders([]);
      setSelectedOrder(null);
    } catch (clearError) {
      alert(clearError.response?.data?.message || "Failed to clear orders.");
    }
  };

  const filteredOrders =
    statusFilter === "All"
      ? orders
      : orders.filter(
          (order) => (order.orderStatus || "Placed") === statusFilter,
        );

  return (
    <>
      <div className="orders-page-toolbar d-flex justify-content-between align-items-center mb-4">
        <h1 className="dashboard-header-title mb-0">
          Recent <span>Orders</span>
        </h1>
        <div className="orders-toolbar-actions d-flex flex-wrap gap-2 align-items-center">
          <select
            className="form-select form-select-sm"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter orders by status"
          >
            <option value="All">All Orders</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={loadOrders}
          >
            Refresh Orders
          </button>
          {orders.length > 0 && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleClearAllOrders}
            >
              <i className="bi bi-trash3 me-1" /> Clear All Orders
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-section orders-table-section p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle orders-table">
            <thead className="table-light">
              <tr>
                <th>S.No.</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Mobile No.</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
                    <span className="spinner-border spinner-border-sm me-2" />{" "}
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="9" className="text-center text-danger py-5">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-2 d-block mb-2" />
                    {orders.length === 0
                      ? "No orders yet."
                      : "No orders match this filter."}
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filteredOrders.map((order, index) => (
                  <tr key={order._id || order.orderId}>
                    <td>{index + 1}</td>
                    <td className="fw-semibold">{order.orderId}</td>
                    <td>
                      {order.customer?.name ||
                        order.shippingAddress?.fullName ||
                        "Guest"}
                      <small className="d-block text-muted">
                        {order.customer?.email || "-"}
                      </small>
                    </td>
                    <td>
                      {order.customer?.mobile ||
                        order.shippingAddress?.mobile ||
                        "-"}
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td className="fw-semibold">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td>
                      <span className="text-capitalize">
                        {order.paymentMethod || "cod"}
                      </span>
                      <small className="d-block text-muted">
                        {order.paymentStatus || "Pending"}
                      </small>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm order-status-select"
                        value={order.orderStatus || "Placed"}
                        disabled={updatingId === order._id}
                        onChange={(event) =>
                          updateOrderStatus(order, event.target.value)
                        }
                      >
                        {getAvailableStatuses(
                          order.orderStatus || "Placed",
                        ).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="orders-action-cell">
                      <div className="order-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary order-action-button"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <i className="bi bi-eye me-1" /> Details
                        </button>
                        {canCancelOrder(order.orderStatus || "Placed") && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger order-action-button"
                            disabled={updatingId === order._id}
                            onClick={() => {
                              if (window.confirm("Cancel this order?")) {
                                updateOrderStatus(order, "Cancelled");
                              }
                            }}
                          >
                            <i className="bi bi-x-circle me-1" /> Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger order-action-button"
                          onClick={() =>
                            handleDeleteOrder(order.orderId || order._id)
                          }
                          title="Delete Order Permanently"
                        >
                          <i className="bi bi-trash3 me-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            role="document"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 shadow order-details-modal">
              <div className="modal-header order-details-header">
                <div>
                  <div className="order-details-kicker">Order summary</div>
                  <h5 className="modal-title mb-1">Order Details</h5>
                  <small className="text-muted">
                    <i className="bi bi-hash" />
                    {selectedOrder.orderId}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setSelectedOrder(null)}
                />
              </div>
              <div className="modal-body order-details-body">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="order-info-card">
                      <div className="order-info-title">
                        <i className="bi bi-person-circle" /> Customer
                      </div>
                      <p className="mb-0 order-info-value">
                        {selectedOrder.customer?.name ||
                          selectedOrder.shippingAddress?.fullName ||
                          "Guest"}
                        <br />
                        <span>
                          <i className="bi bi-envelope me-1" />
                          {selectedOrder.customer?.email || "-"}
                        </span>
                        <br />
                        <span>
                          <i className="bi bi-telephone me-1" />
                          {selectedOrder.customer?.mobile ||
                            selectedOrder.shippingAddress?.mobile ||
                            "-"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="order-info-card">
                      <div className="order-info-title">
                        <i className="bi bi-geo-alt-fill" /> Delivery Address
                      </div>
                      <p className="mb-0 order-info-value">
                        {selectedOrder.shippingAddress?.address ||
                          "Address not provided"}
                        <br />
                        {selectedOrder.shippingAddress?.landmark && (
                          <>
                            {selectedOrder.shippingAddress.landmark}
                            <br />
                          </>
                        )}
                        {[
                          selectedOrder.shippingAddress?.city,
                          selectedOrder.shippingAddress?.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"}{" "}
                        {selectedOrder.shippingAddress?.pincode
                          ? `- ${selectedOrder.shippingAddress.pincode}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="order-section-title mb-0">Items</h6>
                  <span className="order-item-count">
                    {(selectedOrder.items || []).length} item
                    {(selectedOrder.items || []).length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="list-group order-items-list mb-4">
                  {(selectedOrder.items || []).map((item) => (
                    <div
                      className="list-group-item d-flex align-items-center gap-3 order-item-row"
                      key={`${item.productId}-${item.name}`}
                    >
                      <div
                        style={{ width: 48, height: 48 }}
                        className="bg-light rounded d-flex align-items-center justify-content-center order-item-image"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <i className="bi bi-box-seam text-muted" />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <strong>{item.name}</strong>
                        <small className="d-block text-muted">
                          Qty: {item.quantity} x {formatPrice(item.price)}
                        </small>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <div className="row g-2 text-muted order-total-summary">
                  <div className="col-6">Subtotal</div>
                  <div className="col-6 text-end">
                    {formatPrice(selectedOrder.subtotal)}
                  </div>
                  <div className="col-6">Shipping</div>
                  <div className="col-6 text-end">
                    {formatPrice(selectedOrder.shippingFee)}
                  </div>
                  <div className="col-6">Discount</div>
                  <div className="col-6 text-end">
                    -{formatPrice(selectedOrder.discount)}
                  </div>
                  <div className="col-6 fw-bold text-dark">Total</div>
                  <div className="col-6 text-end fw-bold text-dark">
                    {formatPrice(selectedOrder.totalAmount)}
                  </div>
                  <div className="col-6">Payment</div>
                  <div className="col-6 text-end text-capitalize">
                    {selectedOrder.paymentMethod || "cod"}{" "}
                    <span className="order-payment-status">
                      {selectedOrder.paymentStatus || "Pending"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer order-details-footer">
                <div>
                  <span className="order-footer-label">Placed</span>
                  <span className="text-muted">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <select
                    className="form-select form-select-sm order-status-select"
                    style={{ maxWidth: 180 }}
                    value={selectedOrder.orderStatus || "Placed"}
                    disabled={updatingId === selectedOrder._id}
                    onChange={(event) =>
                      updateOrderStatus(selectedOrder, event.target.value)
                    }
                  >
                    {getAvailableStatuses(
                      selectedOrder.orderStatus || "Placed",
                    ).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <span
                    className={`order-status-badge status-${(selectedOrder.orderStatus || "Placed").toLowerCase()}`}
                  >
                    {selectedOrder.orderStatus || "Placed"}
                  </span>
                  {canCancelOrder(selectedOrder.orderStatus || "Placed") && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      disabled={updatingId === selectedOrder._id}
                      onClick={() => {
                        if (window.confirm("Cancel this order?")) {
                          updateOrderStatus(selectedOrder, "Cancelled");
                        }
                      }}
                    >
                      <i className="bi bi-x-circle me-1" /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
