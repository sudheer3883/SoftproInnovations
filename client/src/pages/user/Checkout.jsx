import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useCart } from "../../context/CartContext";
import { API_BASE_URL, getImageUrl } from "../../config/api";

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getSavedAddresses = () => {
  try {
    return JSON.parse(localStorage.getItem("savedAddresses") || "[]");
  } catch {
    return [];
  }
};

const getLoggedInUser = () => {
  try {
    const stored =
      localStorage.getItem("userProfile") ||
      sessionStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialNewAddress = {
  fullName: "",
  mobile: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  type: "Home",
};

const Checkout = () => {
  const { cart, subtotal, shippingFee, discount, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState(getSavedAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const saved = getSavedAddresses();
    return saved.length > 0 ? saved[0].id : null;
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState(() => {
    const user = getLoggedInUser();
    return {
      ...initialNewAddress,
      fullName: user?.name || "",
      mobile: user?.mobile || "",
    };
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // If cart is empty, redirect back to cart
  useEffect(() => {
    if (cart.length === 0 && !isProcessing) {
      navigate("/cart");
    }
  }, [cart, navigate, isProcessing]);

  const handleNewAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleSaveNewAddress = (e) => {
    e.preventDefault();
    const created = {
      ...newAddress,
      id: Date.now(),
    };
    const updated = [...addresses, created];
    setAddresses(updated);
    localStorage.setItem("savedAddresses", JSON.stringify(updated));
    setSelectedAddressId(created.id);
    setShowNewAddressForm(false);
  };

  const handlePlaceOrder = async () => {
    setErrorMessage("");

    // 1. Validate Address
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress) {
      setErrorMessage("Please add and select a delivery address to continue.");
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }

    setIsProcessing(true);
    const user = getLoggedInUser();
    const orderId = `SPI-ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderData = {
      orderId,
      userId: user?.userId || user?.id || user?._id || "guest",
      customer: {
        name: selectedAddress.fullName,
        email: user?.email || "customer@softpro.com",
        mobile: selectedAddress.mobile,
      },
      shippingAddress: selectedAddress,
      items: cart,
      subtotal,
      shippingFee,
      discount,
      totalAmount: total,
      paymentMethod: paymentMethod === "cod" ? "cod" : "razorpay",
      paymentStatus: "Pending",
      paymentDetails: {},
      orderStatus: "Placed",
      createdAt: new Date().toISOString(),
    };

    // Case 1: Cash on Delivery (COD)
    if (paymentMethod === "cod") {
      setProcessingStep("Confirming Cash on Delivery booking...");

      try {
        await axios.post(
          `${API_BASE_URL}/api/order/create`,
          {
            ...orderData,
            paymentStatus: "Pending",
          },
          { timeout: 5000 },
        );
      } catch (backendError) {
        console.warn("Backend order save notice:", backendError.message);
      }

      // Always save to userOrders in localStorage as reliable backup
      try {
        const existingOrders = JSON.parse(
          localStorage.getItem("userOrders") || "[]",
        );
        localStorage.setItem(
          "userOrders",
          JSON.stringify([orderData, ...existingOrders]),
        );
      } catch (storageErr) {
        console.error("LocalStorage order backup error", storageErr);
      }

      await new Promise((r) => setTimeout(r, 400));
      clearCart();
      setIsProcessing(false);
      navigate(`/order-success/${orderId}`, { state: { order: orderData } });
      return;
    }

    // Case 2: Online Payment with Razorpay
    setProcessingStep("Connecting to Razorpay secure payment gateway...");

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setIsProcessing(false);
      setErrorMessage(
        "Could not load Razorpay payment gateway SDK. Please check your internet connection and try again.",
      );
      return;
    }

    try {
      // 1. Pre-create order record in backend
      try {
        await axios.post(
          `${API_BASE_URL}/api/order/create`,
          {
            ...orderData,
            paymentStatus: "Pending",
          },
          { timeout: 5000 },
        );
      } catch (orderSaveErr) {
        console.warn("Order pre-save notice:", orderSaveErr.message);
      }

      // 2. Request Razorpay order ID from backend
      const rzpOrderRes = await axios.post(
        `${API_BASE_URL}/api/payment/razorpay/create-order`,
        {
          amount: total,
          orderId,
          notes: {
            customerName: selectedAddress.fullName,
            customerMobile: selectedAddress.mobile,
            itemsCount: cart.length,
          },
        },
        { timeout: 8000 },
      );

      if (!rzpOrderRes.data || !rzpOrderRes.data.order) {
        throw new Error(
          rzpOrderRes.data?.message ||
            "Unable to create Razorpay payment order.",
        );
      }

      const { order: razorpayOrder, keyId } = rzpOrderRes.data;

      // 3. Configure Razorpay modal options
      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Softpro Innovation",
        description: `Order #${orderId}`,
        image: "/favicon.svg",
        order_id: razorpayOrder.id,
        prefill: {
          name: selectedAddress.fullName,
          email: user?.email || "customer@softpro.com",
          contact: selectedAddress.mobile,
        },
        notes: {
          orderId: orderId,
          address: `${selectedAddress.address}, ${selectedAddress.city}`,
        },
        theme: {
          color: "#1e3a8a",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setProcessingStep("");
          },
        },
        handler: async function (response) {
          try {
            setIsProcessing(true);
            setProcessingStep(
              "Verifying payment security signature with bank...",
            );

            const verifyRes = await axios.post(
              `${API_BASE_URL}/api/payment/razorpay/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              },
            );

            if (verifyRes.data && verifyRes.data.success) {
              const completedOrder = {
                ...orderData,
                paymentStatus: "Completed",
                paymentDetails: {
                  transactionId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              };

              try {
                const existingOrders = JSON.parse(
                  localStorage.getItem("userOrders") || "[]",
                );
                localStorage.setItem(
                  "userOrders",
                  JSON.stringify([
                    completedOrder,
                    ...existingOrders.filter((o) => o.orderId !== orderId),
                  ]),
                );
              } catch (storageErr) {
                console.error("LocalStorage error:", storageErr);
              }

              clearCart();
              setIsProcessing(false);
              navigate(`/order-success/${orderId}`, {
                state: { order: completedOrder },
              });
            } else {
              throw new Error(
                verifyRes.data?.message ||
                  "Payment signature verification failed.",
              );
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            setIsProcessing(false);
            setErrorMessage(
              verifyErr.response?.data?.message ||
                verifyErr.message ||
                "Payment verification could not be confirmed. If money was deducted, please contact customer support with Order ID: " +
                  orderId,
            );
          }
        },
      };

      // Hide full-screen overlay so user can interact with the Razorpay modal
      setIsProcessing(false);
      setProcessingStep("");

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (failResponse) {
        setIsProcessing(false);
        setProcessingStep("");
        setErrorMessage(
          failResponse.error?.description ||
            "Payment was cancelled or rejected by the payment gateway. Please try again.",
        );
      });

      rzpInstance.open();
    } catch (paymentErr) {
      console.error("Razorpay initiation error:", paymentErr);
      setIsProcessing(false);
      setProcessingStep("");
      setErrorMessage(
        paymentErr.response?.data?.message ||
          paymentErr.message ||
          "Unable to start Razorpay payment session. Please try again.",
      );
    }
  };

  return (
    <>
      <Header />
      <main
        className="checkout-page-wrapper py-4 py-lg-5"
        style={{ minHeight: "80vh", backgroundColor: "#f8fafc" }}
      >
        <div className="container px-3 px-xl-5">
          {/* Breadcrumbs */}
          <div className="checkout-breadcrumb mb-3">
            <Link
              to="/"
              className="text-decoration-none text-muted"
              style={{ fontSize: "13px" }}
            >
              Home
            </Link>
            <span className="mx-2 text-muted" style={{ fontSize: "13px" }}>
              &rsaquo;
            </span>
            <Link
              to="/cart"
              className="text-decoration-none text-muted"
              style={{ fontSize: "13px" }}
            >
              Cart
            </Link>
            <span className="mx-2 text-muted" style={{ fontSize: "13px" }}>
              &rsaquo;
            </span>
            <span
              className="fw-semibold"
              style={{ fontSize: "13px", color: "#1e3a8a" }}
            >
              Checkout
            </span>
          </div>

          <h1
            className="fw-bold mb-4"
            style={{ color: "#172033", fontSize: "28px" }}
          >
            Secure{" "}
            <span style={{ color: "#ff4500", fontStyle: "italic" }}>
              Checkout
            </span>
          </h1>

          {errorMessage && (
            <div
              className="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center gap-2 mb-4 py-3"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
              <div>{errorMessage}</div>
            </div>
          )}

          <div className="row g-4">
            {/* Main Checkout Flow (Left Column) */}
            <div className="col-lg-8">
              {/* STEP 1: Delivery Address */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5
                    className="fw-bold mb-0 d-flex align-items-center gap-2"
                    style={{ color: "#1e3a8a" }}
                  >
                    <span
                      className="badge rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{
                        width: "28px",
                        height: "28px",
                        backgroundColor: "#1e3a8a",
                        color: "white",
                        fontSize: "13px",
                      }}
                    >
                      1
                    </span>
                    Delivery Address
                  </h5>
                  {!showNewAddressForm && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill px-3"
                      onClick={() => setShowNewAddressForm(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add New Address
                    </button>
                  )}
                </div>

                {/* List of Saved Addresses */}
                {!showNewAddressForm && (
                  <div className="d-flex flex-column gap-3">
                    {addresses.length === 0 ? (
                      <div className="text-center py-4 bg-light rounded-3">
                        <i className="bi bi-geo-alt fs-2 text-secondary mb-2 d-block"></i>
                        <p className="text-muted mb-2">
                          No saved address found.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm rounded-3 px-3"
                          onClick={() => setShowNewAddressForm(true)}
                        >
                          Add Delivery Address
                        </button>
                      </div>
                    ) : (
                      addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`card border p-3 rounded-3 cursor-pointer transition-all ${selectedAddressId === address.id ? "border-primary shadow-sm" : "border-light-subtle"}`}
                          style={{
                            backgroundColor:
                              selectedAddressId === address.id
                                ? "#f0f5ff"
                                : "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <input
                              type="radio"
                              name="checkoutAddress"
                              className="form-check-input mt-1"
                              checked={selectedAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id)}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <strong className="text-dark">
                                  {address.fullName}
                                </strong>
                                <span
                                  className="badge bg-secondary rounded-pill"
                                  style={{ fontSize: "10px" }}
                                >
                                  {address.type || "Home"}
                                </span>
                                <span className="text-muted small ms-auto">
                                  <i className="bi bi-telephone me-1"></i>
                                  {address.mobile}
                                </span>
                              </div>
                              <p className="text-muted small mb-0">
                                {address.address}
                                {address.landmark
                                  ? `, Near ${address.landmark}`
                                  : ""}
                                <br />
                                {address.city}, {address.state} &ndash;{" "}
                                <span className="fw-semibold">
                                  {address.pincode}
                                </span>
                              </p>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}

                {/* Inline Add Address Form */}
                {showNewAddressForm && (
                  <form
                    onSubmit={handleSaveNewAddress}
                    className="bg-light p-3 rounded-3 border"
                  >
                    <h6 className="fw-bold mb-3 text-dark">
                      Enter New Delivery Address
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          className="form-control form-control-sm"
                          required
                          value={newAddress.fullName}
                          onChange={handleNewAddressChange}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          10-digit Mobile Number *
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          pattern="[0-9]{10}"
                          className="form-control form-control-sm"
                          required
                          value={newAddress.mobile}
                          onChange={handleNewAddressChange}
                          placeholder="e.g. 9876543210"
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label small fw-semibold">
                          Street Address / House No. *
                        </label>
                        <input
                          type="text"
                          name="address"
                          className="form-control form-control-sm"
                          required
                          value={newAddress.address}
                          onChange={handleNewAddressChange}
                          placeholder="Flat, House no., Building, Company, Street"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">
                          Landmark
                        </label>
                        <input
                          type="text"
                          name="landmark"
                          className="form-control form-control-sm"
                          value={newAddress.landmark}
                          onChange={handleNewAddressChange}
                          placeholder="Near landmark (optional)"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          name="city"
                          className="form-control form-control-sm"
                          required
                          value={newAddress.city}
                          onChange={handleNewAddressChange}
                          placeholder="City"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          className="form-control form-control-sm"
                          required
                          value={newAddress.state}
                          onChange={handleNewAddressChange}
                          placeholder="State"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">
                          6-digit Pincode *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          pattern="[0-9]{6}"
                          className="form-control form-control-sm"
                          required
                          value={newAddress.pincode}
                          onChange={handleNewAddressChange}
                          placeholder="6 digits pincode"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold d-block">
                          Address Type
                        </label>
                        <div className="d-flex gap-3">
                          {["Home", "Work", "Other"].map((type) => (
                            <label
                              key={type}
                              className="d-flex align-items-center gap-1.5 small text-muted"
                            >
                              <input
                                type="radio"
                                name="type"
                                value={type}
                                checked={newAddress.type === type}
                                onChange={handleNewAddressChange}
                              />
                              {type}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm px-4 fw-semibold"
                      >
                        Save & Deliver Here
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setShowNewAddressForm(false)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* STEP 2: Order Items Preview */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5
                  className="fw-bold mb-3 d-flex align-items-center gap-2"
                  style={{ color: "#1e3a8a" }}
                >
                  <span
                    className="badge rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "#1e3a8a",
                      color: "white",
                      fontSize: "13px",
                    }}
                  >
                    2
                  </span>
                  Order Items ({cart.length})
                </h5>

                <div className="d-flex flex-column gap-2">
                  {cart.map((item) => (
                    <div
                      key={item.id || item._id}
                      className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light"
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                          style={{
                            width: "48px",
                            height: "48px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {item.img ? (
                            <img
                              src={getImageUrl(item.img)}
                              alt=""
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <i className="bi bi-box-seam text-secondary"></i>
                          )}
                        </div>
                        <div>
                          <h6
                            className="mb-0 fw-semibold text-dark"
                            style={{ fontSize: "13.5px" }}
                          >
                            {item.title}
                          </h6>
                          <small className="text-muted">
                            Qty: {item.quantity} &times;{" "}
                            {formatPrice(item.price)}
                          </small>
                        </div>
                      </div>
                      <span
                        className="fw-bold text-dark"
                        style={{ fontSize: "14px" }}
                      >
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 3: Payment Options */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5
                  className="fw-bold mb-3 d-flex align-items-center gap-2"
                  style={{ color: "#1e3a8a" }}
                >
                  <span
                    className="badge rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "#1e3a8a",
                      color: "white",
                      fontSize: "13px",
                    }}
                  >
                    3
                  </span>
                  Payment Method
                </h5>{" "}
                <div className="d-flex flex-column gap-3">
                  {/* Razorpay Online Payment Option */}
                  <label
                    className={`card border p-3 rounded-3 transition-all ${
                      paymentMethod === "razorpay"
                        ? "border-primary shadow-sm bg-primary-subtle bg-opacity-10"
                        : "border-light-subtle"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="form-check-input mt-1"
                        checked={paymentMethod === "razorpay"}
                        onChange={() => setPaymentMethod("razorpay")}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-dark fs-6">
                              Pay Online via Razorpay
                            </span>
                            <span
                              className="badge text-bg-primary rounded-pill px-2.5 py-1"
                              style={{ fontSize: "11px" }}
                            >
                              Recommended &bull; Fast &amp; Safe
                            </span>
                          </div>
                          <span
                            className="badge bg-light text-primary border border-primary-subtle px-2 py-1"
                            style={{ fontSize: "11px" }}
                          >
                            <i className="bi bi-shield-check me-1"></i> Razorpay
                            Secured
                          </span>
                        </div>
                        <p className="text-muted small mb-2">
                          Instant payment via UPI (Google Pay, PhonePe, Paytm,
                          BHIM, QR), Debit &amp; Credit Cards, Net Banking &amp;
                          Wallets.
                        </p>

                        {/* Supported Instruments Badges */}
                        <div className="d-flex flex-wrap gap-2 pt-1">
                          <span className="badge bg-white text-secondary border px-2 py-1 small">
                            <i className="bi bi-qr-code-scan text-primary me-1"></i>{" "}
                            UPI &amp; QR
                          </span>
                          <span className="badge bg-white text-secondary border px-2 py-1 small">
                            <i className="bi bi-credit-card-2-front text-warning me-1"></i>{" "}
                            Visa &bull; Master &bull; RuPay
                          </span>
                          <span className="badge bg-white text-secondary border px-2 py-1 small">
                            <i className="bi bi-bank text-info me-1"></i> 50+
                            Netbanking Banks
                          </span>
                          <span className="badge bg-white text-secondary border px-2 py-1 small">
                            <i className="bi bi-wallet2 text-success me-1"></i>{" "}
                            Wallets
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Cash on Delivery (COD) Option */}
                  <label
                    className={`card border p-3 rounded-3 transition-all ${
                      paymentMethod === "cod"
                        ? "border-primary shadow-sm bg-primary-subtle bg-opacity-10"
                        : "border-light-subtle"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="form-check-input mt-1"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                          <strong className="text-dark fs-6">
                            Cash on Delivery (COD)
                          </strong>
                          <span
                            className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1"
                            style={{ fontSize: "11px" }}
                          >
                            Doorstep Payment
                          </span>
                        </div>
                        <p className="text-muted small mb-0">
                          Pay with cash or scan delivery executive's UPI QR upon
                          arrival.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary & Pay Action (Right Column) */}
            <div className="col-lg-4">
              <div
                className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top"
                style={{ top: "80px" }}
              >
                <h5 className="fw-bold mb-3" style={{ color: "#172033" }}>
                  Payment Details
                </h5>

                <div
                  className="d-flex justify-content-between text-muted mb-2"
                  style={{ fontSize: "14px" }}
                >
                  <span>Items Subtotal</span>
                  <span className="fw-semibold text-dark">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div
                  className="d-flex justify-content-between text-muted mb-2"
                  style={{ fontSize: "14px" }}
                >
                  <span>Delivery Fee</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-success fw-bold">FREE</span>
                    ) : (
                      <span className="fw-semibold text-dark">
                        {formatPrice(shippingFee)}
                      </span>
                    )}
                  </span>
                </div>

                {discount > 0 && (
                  <div
                    className="d-flex justify-content-between text-success mb-2"
                    style={{ fontSize: "14px" }}
                  >
                    <span>Discount</span>
                    <span className="fw-bold">-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center pt-3 border-top mb-4">
                  <div>
                    <span
                      className="fw-bold fs-5 d-block"
                      style={{ color: "#172033" }}
                    >
                      Total Payable
                    </span>
                    <small className="text-muted">Includes all taxes</small>
                  </div>
                  <span className="fw-bold fs-3" style={{ color: "#1e3a8a" }}>
                    {formatPrice(total)}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn w-100 py-3 rounded-3 fw-bold text-white shadow"
                  style={{ backgroundColor: "#ff4500", fontSize: "16px" }}
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {paymentMethod === "cod" ? (
                    <>Place Order &bull; {formatPrice(total)}</>
                  ) : (
                    <>Pay {formatPrice(total)} &amp; Place Order</>
                  )}
                </button>

                <div className="mt-4 p-3 bg-light rounded-3 text-center border">
                  <i className="bi bi-shield-lock-fill text-success fs-5 d-block mb-1"></i>
                  <strong
                    className="d-block text-dark"
                    style={{ fontSize: "12.5px" }}
                  >
                    100% Safe &amp; Secure Payment
                  </strong>
                  <span className="text-muted" style={{ fontSize: "11px" }}>
                    256-Bit SSL Encrypted &bull; Softpro Guaranteed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Processing Overlay */}
      {isProcessing && (
        <div className="checkout-processing-overlay">
          <div
            className="card border-0 shadow-lg rounded-4 p-5 text-center bg-white"
            style={{ maxWidth: "420px" }}
          >
            <div
              className="spinner-border text-primary mx-auto mb-3"
              style={{ width: "3.5rem", height: "3.5rem" }}
              role="status"
            ></div>
            <h4 className="fw-bold text-dark mb-2">Processing Your Order</h4>
            <p className="text-muted small mb-0">{processingStep}</p>
            <small
              className="text-secondary mt-3 d-block"
              style={{ fontSize: "11.5px" }}
            >
              <i className="bi bi-lock-fill me-1"></i> Please do not refresh or
              close this window.
            </small>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Checkout;
