import { useWishlist } from "../../context/useWishlist";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AccountSidebar from "../../components/AccountSidebar";

const Wishlist = () => {
  const { items, removeFromWishlist } = useWishlist();

  return (
    <>
      <Header />
      <main className="profile-page account-subpage">
        <AccountSidebar subtitle="Save products you love" />
        <section className="settings-main" aria-labelledby="wishlist-title">
          <header className="settings-heading">
            <h1 id="wishlist-title">My Wishlist</h1>
            <p>Keep your favourite electronics ready for your next project.</p>
          </header>
          <section className="wishlist-card">
            <div className="saved-addresses-heading">
              <h2>Saved Products</h2>
              <span>{items.length} saved</span>
            </div>
            {items.length === 0 ? (
              <div className="wishlist-empty">
                <div className="wishlist-icon">
                  <i className="bi bi-heart" />
                </div>
                <h3>Your wishlist is empty</h3>
                <p>Save products you love and find them here anytime.</p>
                <Link className="orders-shop-button" to="/Product">
                  <i className="bi bi-grid" /> Explore Products
                </Link>
              </div>
            ) : (
              <div className="wishlist-grid">
                {items.map((item) => (
                  <article className="wishlist-item" key={item.id}>
                    <div className="wishlist-image">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          onError={(event) => {
                            if (
                              item.fallbackImage &&
                              !event.currentTarget.dataset.fallbackTried
                            ) {
                              event.currentTarget.dataset.fallbackTried =
                                "true";
                              event.currentTarget.src = item.fallbackImage;
                              return;
                            }
                            event.currentTarget.style.display = "none";
                            event.currentTarget.nextElementSibling.style.display =
                              "block";
                          }}
                        />
                      ) : (
                        <i className="bi bi-box-seam" />
                      )}
                      {item.image && (
                        <i
                          className="bi bi-box-seam"
                          style={{ display: "none" }}
                        />
                      )}
                    </div>
                    <div className="wishlist-item-content">
                      <span>{item.category || "Product"}</span>
                      <h3>{item.name}</h3>
                      <strong>
                        ₹{Number(item.price || 0).toLocaleString("en-IN")}
                      </strong>
                      <div>
                        <Link to={`/product/${item.id}`}>View Product</Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          <i className="bi bi-trash" /> Remove
                        </button>
                      </div>
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

export default Wishlist;
