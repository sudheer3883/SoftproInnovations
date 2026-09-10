import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AccountSidebar from "../../components/AccountSidebar";

const Orders = () => {
  const [orders, setOrders] = useState([]);

  const canCancelOrder = (status) =>
    ["Placed", "Processing", "Shipped"].includes(status || "Placed");

  const handleCancelOrder = (orderId) => {
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
  };

  useEffect(() => {
    try {
      const storedOrders = JSON.parse(
        localStorage.getItem("userOrders") || "[]",
      );
      const activeOrders = storedOrders.filter(
        (order) => order.orderStatus !== "Cancelled",
      );
      setOrders(activeOrders);
      localStorage.setItem("userOrders", JSON.stringify(activeOrders));
    } catch {
      setOrders([]);
    }
  }, []);

  return (
    <>
      <Header />
      <main className="profile-page orders-page">
        <AccountSidebar subtitle="Order history and tracking" />

        <section className="settings-main" aria-labelledby="orders-title">
          <header className="settings-heading">
            <h1 id="orders-title">My Orders</h1>
            <p>Track your purchases and view your order details.</p>
          </header>
          <section className="orders-card">
            <div className="orders-card-heading">
              <div>
                <h2>Order History</h2>
                <p>All your recent orders will appear here.</p>
              </div>
              <span className="orders-count">
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
              </span>
            </div>
            {orders.length === 0 ? (
              <div className="orders-empty">
                <div className="orders-empty-icon">
                  <i className="bi bi-bag-x" />
                </div>
                <h3>No orders yet</h3>
                <p>
                  When you place an order, its status and details will show up
                  here.
                </p>
                <Link to="/Product" className="orders-shop-button">
                  <i className="bi bi-bag" /> Start Shopping
                </Link>
              </div>
            ) : (
              <div className="orders-history-list">
                {orders.map((order) => (
                  <article className="order-history-item" key={order.orderId}>
                    <div>
                      <strong>{order.orderId}</strong>
                      <p>
                        {order.items?.length || 0} items &middot;{" "}
                        {order.paymentMethod?.toUpperCase()} &middot; ₹
                        {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`badge ${order.orderStatus === "Cancelled" ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"}`}
                      >
                        {order.orderStatus || "Placed"}
                      </span>
                      {canCancelOrder(order.orderStatus || "Placed") && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (window.confirm("Cancel this order?")) {
                              handleCancelOrder(order.orderId);
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </article>
                ))}
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
