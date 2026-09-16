import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./QuickHelpPage.css";

const ticketStorageKey = "softpro-admin-complaints";

const helpContent = {
  "track-order": {
    eyebrow: "ORDER TRACKING",
    title: "Know where your order is, at a glance.",
    description:
      "Enter your order ID to see the latest status saved in your account.",
  },
  returns: {
    eyebrow: "RETURNS & REFUNDS",
    title: "A clear return policy, without the fine print maze.",
    description:
      "Most eligible items can be returned within 7 days of delivery. Keep the product, packaging, and invoice ready for a quick review.",
  },
  support: {
    eyebrow: "TECHNICAL SUPPORT",
    title: "Tell us what is not working.",
    description:
      "Share the product and the issue. Our support team will review your request and follow up by email.",
  },
  b2b: {
    eyebrow: "BULK / B2B ORDERS",
    title: "Build a quote for your next big order.",
    description:
      "Tell us what you need, how many units, and when you need them. We will prepare a practical quote for your team.",
  },
};

const createTicket = (details, subject, priority = "Medium") => {
  let tickets;
  try {
    tickets = JSON.parse(localStorage.getItem(ticketStorageKey) || "[]");
  } catch {
    tickets = [];
  }

  const ticket = {
    id: `TKT-${Math.floor(900 + Math.random() * 90)}`,
    customer: details.name,
    email: details.email,
    subject,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    priority,
    status: "Open",
    message: details.message,
  };

  localStorage.setItem(ticketStorageKey, JSON.stringify([ticket, ...tickets]));
  return ticket;
};

const QuickHelpPage = ({ kind }) => {
  const content = helpContent[kind];
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    quantity: "",
  });
  const [notice, setNotice] = useState("");
  const [orderId, setOrderId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState("");

  const orders = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userOrders") || "[]");
    } catch {
      return [];
    }
  }, []);

  const updateForm = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleTrack = (event) => {
    event.preventDefault();
    const normalizedId = orderId.trim().toLowerCase();
    const match = orders.find(
      (order) => String(order.orderId || "").toLowerCase() === normalizedId,
    );
    setTrackedOrder(match || null);
    setTrackError(
      match
        ? ""
        : "No order found. Check the ID from your order confirmation email.",
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const subject =
      kind === "b2b"
        ? `B2B quote request (${form.quantity || "quantity not provided"})`
        : kind === "support"
          ? "Technical support request"
          : "Return or refund request";
    const ticket = createTicket(
      form,
      subject,
      kind === "support" ? "High" : "Medium",
    );
    setNotice(
      `Request submitted successfully. Ticket #${ticket.id} has been created.`,
    );
    setForm({ name: "", email: "", message: "", quantity: "" });
  };

  return (
    <>
      <Header />
      <main className="quick-help-page">
        <div className="help-shell">
          <Link to="/contact" className="help-back">
            <i className="bi bi-arrow-left" /> Back to Contact
          </Link>
          <header className="help-hero">
            <span>{content.eyebrow}</span>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
          </header>

          {kind === "track-order" ? (
            <section className="help-card">
              <div className="help-card-heading">
                <i className="bi bi-box-seam" />
                <div>
                  <h2>Track an order</h2>
                  <p>
                    Enter the order ID exactly as shown in your confirmation.
                  </p>
                </div>
              </div>
              <form className="help-inline-form" onSubmit={handleTrack}>
                <input
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="Example: ORD-9083"
                  aria-label="Order ID"
                  required
                />
                <button type="submit">
                  Track order <i className="bi bi-arrow-right" />
                </button>
              </form>
              {trackError && (
                <p className="help-error" role="alert">
                  <i className="bi bi-info-circle" /> {trackError}
                </p>
              )}
              {trackedOrder && (
                <div className="tracking-result">
                  <div>
                    <span>Order ID</span>
                    <strong>{trackedOrder.orderId}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{trackedOrder.orderStatus || "Placed"}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>
                      Rs.{" "}
                      {Number(trackedOrder.totalAmount || 0).toLocaleString(
                        "en-IN",
                      )}
                    </strong>
                  </div>
                </div>
              )}
              {!orders.length && (
                <p className="help-hint">
                  No local orders are available yet. Place an order first, then
                  return here to track it.
                </p>
              )}
            </section>
          ) : kind === "returns" ? (
            <div className="help-grid">
              <section className="help-card">
                <div className="help-card-heading">
                  <i className="bi bi-arrow-repeat" />
                  <div>
                    <h2>Return checklist</h2>
                    <p>
                      These simple steps help us process your request faster.
                    </p>
                  </div>
                </div>
                <ol className="help-steps">
                  <li>
                    <strong>Start within 7 days</strong>
                    <span>
                      Contact us with your order ID and reason for return.
                    </span>
                  </li>
                  <li>
                    <strong>Keep the product complete</strong>
                    <span>
                      Include accessories, packaging, and invoice where
                      possible.
                    </span>
                  </li>
                  <li>
                    <strong>Quality check and refund</strong>
                    <span>
                      After approval, refunds are sent to the original payment
                      method.
                    </span>
                  </li>
                </ol>
              </section>
              <section className="help-card help-faq">
                <h2>Common questions</h2>
                <details open>
                  <summary>When will I receive my refund?</summary>
                  <p>
                    Approved refunds usually appear within 5 to 7 business days.
                  </p>
                </details>
                <details>
                  <summary>Can I return a damaged item?</summary>
                  <p>
                    Yes. Share clear photos and your order ID as soon as
                    possible.
                  </p>
                </details>
                <details>
                  <summary>Need to start a request?</summary>
                  <p>
                    Start a return request from our contact form and include
                    your order ID and reason for return.
                  </p>
                </details>
                <Link to="/contact" className="help-card-link">
                  Start a return request <i className="bi bi-arrow-right" />
                </Link>
              </section>
            </div>
          ) : (
            <section className="help-card help-form-card">
              <div className="help-card-heading">
                <i
                  className={`bi ${kind === "b2b" ? "bi-briefcase" : "bi-tools"}`}
                />
                <div>
                  <h2>
                    {kind === "b2b"
                      ? "Request a B2B quote"
                      : "Open a support ticket"}
                  </h2>
                  <p>
                    {kind === "b2b"
                      ? "We usually reply with availability and pricing within one business day."
                      : "Include model names, order IDs, or photos in your message when relevant."}
                  </p>
                </div>
              </div>
              {notice && (
                <div className="help-success" role="status">
                  <i className="bi bi-check-circle-fill" /> {notice}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="help-form-grid">
                  <label>
                    Full name
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateForm}
                      required
                      placeholder="Your name"
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={updateForm}
                      required
                      placeholder="you@example.com"
                    />
                  </label>
                  {kind === "b2b" && (
                    <label>
                      Required quantity
                      <input
                        name="quantity"
                        value={form.quantity}
                        onChange={updateForm}
                        required
                        placeholder="e.g. 100 units"
                      />
                    </label>
                  )}
                </div>
                <label>
                  Message
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={updateForm}
                    required
                    rows="5"
                    placeholder={
                      kind === "b2b"
                        ? "Tell us about your products, delivery city, and timeline..."
                        : "Describe the issue and how we can help..."
                    }
                  />
                </label>
                <button className="help-submit" type="submit">
                  Submit request <i className="bi bi-send" />
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default QuickHelpPage;
