import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const OrderSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (order) return;

    const fetchOrder = async () => {
      try {
        // First check localStorage userOrders
        const saved = JSON.parse(localStorage.getItem("userOrders") || "[]");
        const localMatch = saved.find(
          (o) => o.orderId === orderId || o._id === orderId,
        );
        if (localMatch) {
          setOrder(localMatch);
          setLoading(false);
          return;
        }

        // If not found in localStorage, fetch from backend API
        const res = await axios.get(
          `http://localhost:5000/api/order/${orderId}`,
        );
        if (res.data) {
          setOrder(res.data);
        }
      } catch (err) {
        console.error("Failed to load order info", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, order]);

  const deliveryDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div
          className="container text-center py-5"
          style={{ minHeight: "60vh" }}
        >
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">
            Retrieving your order confirmation...
          </p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        className="order-success-page py-4 py-lg-5"
        style={{ minHeight: "80vh", backgroundColor: "#f8fafc" }}
      >
        <div className="container px-3 px-xl-5" style={{ maxWidth: "850px" }}>
          {/* Success Header Banner */}
          <div className="card border-0 shadow-sm rounded-4 text-center p-4 p-md-5 mb-4 bg-white">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "76px",
                height: "76px",
                backgroundColor: "#dcfce7",
                color: "#16a34a",
                fontSize: "38px",
              }}
            >
              <i className="bi bi-check2-circle"></i>
            </div>
            <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill mb-2 align-self-center fw-semibold">
              ORDER CONFIRMED
            </span>
            <h2 className="fw-bold text-dark mb-2">
              Thank You for Your Order!
            </h2>
            <p
              className="text-muted mx-auto mb-3"
              style={{ maxWidth: "520px", fontSize: "14.5px" }}
            >
              We have received your order. We're now prepping your electronics
              components for dispatch from the Softpro Innovation warehouse.
            </p>
            <div className="d-inline-flex align-items-center justify-content-center gap-2 p-2 px-3 rounded-pill bg-light border mx-auto">
              <span className="text-muted small">Order ID:</span>
              <strong
                className="text-dark font-monospace"
                style={{ fontSize: "14px" }}
              >
                {order?.orderId || orderId}
              </strong>
            </div>
          </div>

          {/* Delivery & Payment Details Card */}
          <div className="row g-3 mb-4">
            {/* Delivery Address */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-geo-alt text-primary fs-5"></i> Delivery
                  Address
                </h6>
                {order?.shippingAddress ? (
                  <div className="text-muted small">
                    <strong
                      className="text-dark d-block mb-1"
                      style={{ fontSize: "14px" }}
                    >
                      {order.shippingAddress.fullName}
                    </strong>
                    <p className="mb-1">
                      {order.shippingAddress.address}
                      {order.shippingAddress.landmark
                        ? `, ${order.shippingAddress.landmark}`
                        : ""}
                    </p>
                    <p className="mb-2">
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} &ndash;{" "}
                      {order.shippingAddress.pincode}
                    </p>
                    <div>
                      <i className="bi bi-telephone me-1"></i>{" "}
                      {order.shippingAddress.mobile}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted small mb-0">
                    Delivery details confirmed.
                  </p>
                )}
              </div>
            </div>

            {/* Estimated Delivery & Payment */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-truck text-primary fs-5"></i> Shipping
                  &amp; Payment
                </h6>
                <div className="text-muted small">
                  <div className="mb-2">
                    <span
                      className="d-block text-muted"
                      style={{ fontSize: "11.5px" }}
                    >
                      ESTIMATED DELIVERY
                    </span>
                    <strong className="text-success fs-6">
                      {deliveryDateStr()}
                    </strong>
                  </div>
                  <div className="mb-2">
                    <span
                      className="d-block text-muted"
                      style={{ fontSize: "11.5px" }}
                    >
                      PAYMENT METHOD
                    </span>
                    <strong className="text-dark">
                      {order?.paymentMethod === "cod"
                        ? "Cash on Delivery (COD)"
                        : order?.paymentMethod === "razorpay"
                          ? "Razorpay (Online)"
                          : order?.paymentMethod?.toUpperCase()}
                    </strong>
                    <span
                      className={`badge ms-2 ${order?.paymentStatus === "Completed" ? "bg-success" : "bg-warning text-dark"}`}
                    >
                      {order?.paymentStatus || "Pending"}
                    </span>
                    {order?.paymentDetails?.transactionId && (
                      <small
                        className="d-block text-muted font-monospace mt-1"
                        style={{ fontSize: "11px" }}
                      >
                        Txn ID: {order.paymentDetails.transactionId}
                      </small>
                    )}
                  </div>
                  <div>
                    <span
                      className="d-block text-muted"
                      style={{ fontSize: "11.5px" }}
                    >
                      TOTAL PAID / PAYABLE
                    </span>
                    <strong className="text-primary fs-6">
                      {formatPrice(order?.totalAmount)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Items List */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <h6 className="fw-bold text-dark mb-3">Items in this Order</h6>
            <div className="d-flex flex-column gap-3">
              {(order?.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center justify-content-between pb-3 border-bottom"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center bg-light rounded p-1"
                      style={{
                        width: "54px",
                        height: "54px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {item.image || item.img ? (
                        <img
                          src={item.image || item.img}
                          alt=""
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <i className="bi bi-box-seam text-secondary fs-4"></i>
                      )}
                    </div>
                    <div>
                      <h6
                        className="mb-0 fw-semibold text-dark"
                        style={{ fontSize: "14px" }}
                      >
                        {item.name || item.title}
                      </h6>
                      <small className="text-muted">
                        Qty: {item.quantity} &bull; Price:{" "}
                        {formatPrice(item.price)}
                      </small>
                    </div>
                  </div>
                  <span
                    className="fw-bold text-dark"
                    style={{ fontSize: "14px" }}
                  >
                    {formatPrice(
                      Number(item.price || 0) * Number(item.quantity || 1),
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary breakdown */}
            <div className="pt-3">
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Subtotal</span>
                <span>{formatPrice(order?.subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Delivery Fee</span>
                <span>
                  {order?.shippingFee === 0
                    ? "FREE"
                    : formatPrice(order?.shippingFee)}
                </span>
              </div>
              {Number(order?.discount) > 0 && (
                <div className="d-flex justify-content-between text-success small mb-1">
                  <span>Discount</span>
                  <span>-{formatPrice(order?.discount)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold text-dark pt-2 border-top fs-6">
                <span>Total</span>
                <span style={{ color: "#1e3a8a" }}>
                  {formatPrice(order?.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <Link
              to="/profile/orders"
              className="btn btn-primary px-4 py-2.5 rounded-3 fw-semibold shadow-sm"
              style={{ backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" }}
            >
              <i className="bi bi-bag-check me-1.5"></i> View in My Orders
            </Link>
            <Link
              to="/Product"
              className="btn btn-outline-secondary px-4 py-2.5 rounded-3 fw-semibold"
            >
              <i className="bi bi-arrow-left me-1.5"></i> Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderSuccess;
