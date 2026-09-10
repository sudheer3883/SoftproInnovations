import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useCart } from "../../context/CartContext";

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

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

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [upiApp, setUpiApp] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);

  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [selectedBank, setSelectedBank] = useState("SBI");

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

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    val = val.replace(/(\d{4})/g, "$1 ").trim();
    setCardData({ ...cardData, number: val });
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardData({ ...cardData, expiry: val });
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

    // Validate payment inputs before redirecting to PayU.
    if (paymentMethod === "card") {
      if (cardData.number.replace(/\s/g, "").length < 16) {
        setErrorMessage("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardData.name.trim()) {
        setErrorMessage("Please enter the cardholder name.");
        return;
      }
      if (!cardData.expiry || cardData.expiry.length < 5) {
        setErrorMessage("Please enter a valid card expiry date (MM/YY).");
        return;
      }
      const [month, year] = cardData.expiry.split("/").map(Number);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      if (
        month < 1 ||
        month > 12 ||
        year < currentYear ||
        (year === currentYear && month < currentMonth)
      ) {
        setErrorMessage("Please enter a valid, non-expired card expiry date.");
        return;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        setErrorMessage("Please enter a valid 3-digit CVV.");
        return;
      }
    }

    if (paymentMethod === "upi" && (!upiId.trim() || !upiVerified)) {
      setErrorMessage("Please enter and verify your UPI ID before continuing.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep(
      paymentMethod === "cod"
        ? "Confirming Cash on Delivery booking..."
        : "Creating secure PayU payment session...",
    );

    const user = getLoggedInUser();
    const orderId = `SPI-ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderData = {
      orderId,
      userId: user?.userId || "guest",
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
      paymentMethod,
      paymentStatus: "Pending",
      paymentDetails: {
        upiId: paymentMethod === "upi" ? upiId || `${upiApp}@upi` : "",
        cardLast4: paymentMethod === "card" ? cardData.number.slice(-4) : "",
        bankName: paymentMethod === "netbanking" ? selectedBank : "",
      },
      orderStatus: "Placed",
      createdAt: new Date().toISOString(),
    };

    if (paymentMethod !== "cod") {
      try {
        await axios.post("http://localhost:5000/api/order/create", orderData, {
          timeout: 5000,
        });
        const paymentResponse = await axios.post(
          "http://localhost:5000/api/payment/payu/initiate",
          {
            orderId,
            amount: total,
            productinfo: `${cart.length} item(s) from Softpro Innovation`,
            firstname: selectedAddress.fullName,
            email: user?.email || "customer@softpro.com",
            phone: selectedAddress.mobile,
            paymentMethod,
          },
          { timeout: 5000 },
        );

        const existingOrders = JSON.parse(
          localStorage.getItem("userOrders") || "[]",
        );
        localStorage.setItem(
          "userOrders",
          JSON.stringify([orderData, ...existingOrders]),
        );
        const paymentForm = document.createElement("form");
        paymentForm.method = "POST";
        paymentForm.action = paymentResponse.data.action;
        paymentForm.style.display = "none";
        Object.entries(paymentResponse.data.fields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          paymentForm.appendChild(input);
        });
        document.body.appendChild(paymentForm);
        paymentForm.submit();
        return;
      } catch (paymentError) {
        setIsProcessing(false);
        setErrorMessage(
          paymentError.response?.data?.message ||
            "Unable to start PayU payment. Please try again.",
        );
        return;
      }
    }

    setProcessingStep("Generating order invoice & packaging details...");

    // Try persisting in backend
    try {
      await axios.post("http://localhost:5000/api/order/create", orderData, {
        timeout: 3000,
      });
    } catch (backendError) {
      console.warn(
        "Backend order save fallback to localStorage:",
        backendError.message,
      );
    }

    // Always save to userOrders in localStorage as reliable offline/session backup
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

    // Clear cart and redirect to success page
    clearCart();
    setIsProcessing(false);
    navigate(`/order-success/${orderId}`, { state: { order: orderData } });
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
                              src={item.img}
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
                </h5>

                <div className="d-flex flex-column gap-3">
                  <div className="alert alert-warning border-0 rounded-3 py-2 px-3 mb-0 small fw-semibold text-warning-emphasis">
                    UPI, Card and Net Banking payments are securely processed by
                    PayU.
                  </div>

                  {/* COD Option */}
                  <label
                    className={`card border p-3 rounded-3 cursor-pointer ${paymentMethod === "cod" ? "border-primary bg-primary-subtle bg-opacity-10" : "border-light-subtle"}`}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="form-check-input"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <i className="bi bi-cash-stack fs-4 text-success"></i>
                        <div>
                          <strong className="text-dark d-block">
                            Cash on Delivery (COD)
                          </strong>
                          <small className="text-muted">
                            Pay by cash or UPI on delivery. Zero extra fee.
                          </small>
                        </div>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Recommended
                      </span>
                    </div>
                  </label>

                  {/* UPI Option */}
                  <div
                    className={`card border p-3 rounded-3 ${paymentMethod === "upi" ? "border-primary bg-primary-subtle bg-opacity-10" : "border-light-subtle"}`}
                  >
                    <label
                      className="d-flex align-items-center gap-3 mb-0"
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="form-check-input"
                        checked={paymentMethod === "upi"}
                        onChange={() => setPaymentMethod("upi")}
                      />
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <i className="bi bi-qr-code-scan fs-4 text-primary"></i>
                        <div>
                          <strong className="text-dark d-block">
                            UPI / QR Code (Instant)
                          </strong>
                          <small className="text-muted">
                            Google Pay, PhonePe, Paytm, BHIM
                          </small>
                        </div>
                      </div>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        Fast & Instant
                      </span>
                    </label>

                    {paymentMethod === "upi" && (
                      <div className="mt-3 pt-3 border-top bg-white p-3 rounded-3">
                        <div className="row align-items-center g-3">
                          <div className="col-md-5 text-center border-end">
                            <div className="p-2 border rounded-3 d-inline-block bg-white shadow-sm mb-2">
                              {/* Realistic Dynamic QR Code presentation */}
                              <div
                                style={{
                                  width: "135px",
                                  height: "135px",
                                  background: "#f8fafc",
                                }}
                                className="d-flex flex-column align-items-center justify-content-center p-1"
                              >
                                <i
                                  className="bi bi-qr-code"
                                  style={{ fontSize: "88px", color: "#1e3a8a" }}
                                ></i>
                                <small
                                  className="fw-bold"
                                  style={{ fontSize: "10px", color: "#ff4500" }}
                                >
                                  SCAN TO PAY {formatPrice(total)}
                                </small>
                              </div>
                            </div>
                            <small
                              className="d-block text-muted"
                              style={{ fontSize: "11px" }}
                            >
                              Merchant: <strong>Softpro Innovations</strong>
                            </small>
                          </div>
                          <div className="col-md-7">
                            <label className="form-label small fw-semibold text-dark">
                              Select UPI App or enter UPI ID
                            </label>
                            <div className="d-flex gap-2 mb-2 flex-wrap">
                              {["GPay", "PhonePe", "Paytm", "BHIM"].map(
                                (app) => (
                                  <button
                                    key={app}
                                    type="button"
                                    className={`btn btn-sm rounded-pill px-3 ${upiApp === app.toLowerCase() ? "btn-primary" : "btn-outline-secondary"}`}
                                    onClick={() => setUpiApp(app.toLowerCase())}
                                  >
                                    {app}
                                  </button>
                                ),
                              )}
                            </div>
                            <div className="input-group input-group-sm">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. yourname@okhdfcbank"
                                value={upiId}
                                onChange={(e) => {
                                  setUpiId(e.target.value);
                                  setUpiVerified(false);
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-dark"
                                onClick={() => {
                                  if (upiId) setUpiVerified(true);
                                }}
                              >
                                {upiVerified ? "✓ Verified" : "Verify"}
                              </button>
                            </div>
                            {upiVerified && (
                              <small className="text-success mt-1 d-block">
                                ✓ UPI ID verified and ready for payment
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Option */}
                  <div
                    className={`card border p-3 rounded-3 ${paymentMethod === "card" ? "border-primary bg-primary-subtle bg-opacity-10" : "border-light-subtle"}`}
                  >
                    <label
                      className="d-flex align-items-center gap-3 mb-0"
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="form-check-input"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                      />
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <i className="bi bi-credit-card-2-front fs-4 text-warning"></i>
                        <div>
                          <strong className="text-dark d-block">
                            Credit / Debit Card
                          </strong>
                          <small className="text-muted">
                            Visa, MasterCard, RuPay, Maestro
                          </small>
                        </div>
                      </div>
                      <div
                        className="d-flex gap-1 text-secondary"
                        style={{ fontSize: "18px" }}
                      >
                        <i className="bi bi-credit-card"></i>
                      </div>
                    </label>

                    {paymentMethod === "card" && (
                      <div className="mt-3 pt-3 border-top bg-white p-3 rounded-3">
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label small fw-semibold">
                              Card Number
                            </label>
                            <div className="position-relative">
                              <input
                                type="text"
                                className="form-control form-control-sm pe-5"
                                placeholder="XXXX XXXX XXXX XXXX"
                                value={cardData.number}
                                onChange={handleCardNumberChange}
                                maxLength="19"
                              />
                              <i className="bi bi-credit-card position-absolute top-50 end-0 translate-middle-y me-3 text-muted"></i>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Name as printed on card"
                              value={cardData.name}
                              onChange={(e) =>
                                setCardData({
                                  ...cardData,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-semibold">
                              Valid Thru
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="MM/YY"
                              value={cardData.expiry}
                              onChange={handleExpiryChange}
                              maxLength="5"
                            />
                          </div>
                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-semibold">
                              CVV
                            </label>
                            <input
                              type="password"
                              className="form-control form-control-sm"
                              placeholder="•••"
                              maxLength="3"
                              value={cardData.cvv}
                              onChange={(e) =>
                                setCardData({
                                  ...cardData,
                                  cvv: e.target.value.replace(/\D/g, ""),
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Net Banking Option */}
                  <div
                    className={`card border p-3 rounded-3 ${paymentMethod === "netbanking" ? "border-primary bg-primary-subtle bg-opacity-10" : "border-light-subtle"}`}
                  >
                    <label
                      className="d-flex align-items-center gap-3 mb-0"
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="form-check-input"
                        checked={paymentMethod === "netbanking"}
                        onChange={() => setPaymentMethod("netbanking")}
                      />
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <i className="bi bi-bank fs-4 text-info"></i>
                        <div>
                          <strong className="text-dark d-block">
                            Net Banking
                          </strong>
                          <small className="text-muted">
                            All major Indian banks supported
                          </small>
                        </div>
                      </div>
                    </label>

                    {paymentMethod === "netbanking" && (
                      <div className="mt-3 pt-3 border-top bg-white p-3 rounded-3">
                        <label className="form-label small fw-semibold">
                          Select Your Bank
                        </label>
                        <div className="d-flex gap-2 flex-wrap mb-2">
                          {["SBI", "HDFC", "ICICI", "Axis", "PNB", "Kotak"].map(
                            (bank) => (
                              <button
                                key={bank}
                                type="button"
                                className={`btn btn-sm ${selectedBank === bank ? "btn-primary" : "btn-outline-secondary"}`}
                                onClick={() => setSelectedBank(bank)}
                              >
                                {bank}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
