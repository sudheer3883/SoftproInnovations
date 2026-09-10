import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useCart } from '../../context/CartContext';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Cart = () => {
    const {
        cart,
        cartCount,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        shippingFee,
        coupon,
        discount,
        total,
        applyCoupon,
        removeCoupon
    } = useCart();

    const [couponInput, setCouponInput] = useState('');
    const [couponMsg, setCouponMsg] = useState({ text: '', isError: false });
    const navigate = useNavigate();

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        if (!couponInput.trim()) return;
        const res = applyCoupon(couponInput);
        setCouponMsg({ text: res.message, isError: !res.success });
        if (res.success) setCouponInput('');
    };

    return (
        <>
            <Header />
            <main className="cart-page-wrapper py-4 py-lg-5" style={{ minHeight: '75vh', backgroundColor: '#f8fafc' }}>
                <div className="container px-3 px-xl-5">
                    {/* Breadcrumb */}
                    <div className="cart-breadcrumb mb-3">
                        <Link to="/" className="text-decoration-none text-muted" style={{ fontSize: '13px' }}>Home</Link>
                        <span className="mx-2 text-muted" style={{ fontSize: '13px' }}>&rsaquo;</span>
                        <span className="fw-semibold" style={{ fontSize: '13px', color: '#1e3a8a' }}>Shopping Cart</span>
                    </div>

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4 border-bottom pb-3">
                        <div>
                            <h1 className="fw-bold mb-1" style={{ color: '#172033', fontSize: '28px' }}>
                                Shopping <span style={{ color: '#ff4500', fontStyle: 'italic' }}>Cart</span>
                            </h1>
                            <p className="text-muted small mb-0">
                                {cartCount > 0 ? `You have ${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart.` : 'Your cart is currently empty.'}
                            </p>
                        </div>
                        {cart.length > 0 && (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1.5 align-self-start align-self-md-auto"
                                onClick={clearCart}
                                title="Empty your entire cart"
                            >
                                <i className="bi bi-trash3"></i> Clear Cart
                            </button>
                        )}
                    </div>

                    {cart.length === 0 ? (
                        /* Empty State */
                        <div className="card border-0 shadow-sm rounded-4 p-5 text-center my-4 bg-white">
                            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                                style={{ width: '84px', height: '84px', backgroundColor: '#eff6ff', color: '#3945e0', fontSize: '38px' }}>
                                <i className="bi bi-cart-x"></i>
                            </div>
                            <h3 className="fw-bold text-dark mb-2">Your Shopping Cart is Empty</h3>
                            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '440px', fontSize: '14.5px' }}>
                                Explore our collection of development boards, sensors, electronics components, and robotics modules.
                            </p>
                            <div>
                                <Link
                                    to="/Product"
                                    className="btn btn-primary px-4 py-2.5 rounded-3 fw-semibold shadow-sm"
                                    style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
                                >
                                    <i className="bi bi-arrow-left me-1"></i> Start Shopping
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* Cart Content Grid */
                        <div className="row g-4">
                            {/* Items Column */}
                            <div className="col-lg-8">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3 bg-white">
                                    <div className="table-responsive">
                                        <table className="table align-middle mb-0">
                                            <thead className="table-light">
                                                <tr style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <th className="ps-4 py-3">Product</th>
                                                    <th className="py-3 text-center">Price</th>
                                                    <th className="py-3 text-center">Quantity</th>
                                                    <th className="py-3 text-end pe-4">Subtotal</th>
                                                    <th className="py-3 text-center" style={{ width: '50px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cart.map((item) => {
                                                    const itemPrice = Number(item.priceValue ?? item.price ?? 0);
                                                    const itemTotal = itemPrice * (item.quantity || 1);
                                                    const productId = item.id || item._id;

                                                    return (
                                                        <tr key={productId} className="cart-item-row">
                                                            {/* Product info */}
                                                            <td className="ps-4 py-3">
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div
                                                                        className="d-flex align-items-center justify-content-center bg-light rounded-3 p-1 flex-shrink-0"
                                                                        style={{ width: '64px', height: '64px', border: '1px solid #e2e8f0' }}
                                                                    >
                                                                        {item.img ? (
                                                                            <img
                                                                                src={item.img}
                                                                                alt={item.title}
                                                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                                            />
                                                                        ) : (
                                                                            <i className="bi bi-box-seam text-secondary fs-4"></i>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <span className="badge bg-light text-secondary border mb-1" style={{ fontSize: '10px' }}>
                                                                            {item.category || 'Components'}
                                                                        </span>
                                                                        <h6 className="mb-0 fw-semibold">
                                                                            <Link
                                                                                to={`/product/${productId}`}
                                                                                className="text-dark text-decoration-none hover-primary"
                                                                                style={{ fontSize: '14.5px' }}
                                                                            >
                                                                                {item.title || item.name}
                                                                            </Link>
                                                                        </h6>
                                                                        {item.brand && (
                                                                            <small className="text-muted d-block" style={{ fontSize: '11.5px' }}>
                                                                                Brand: {item.brand}
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Unit Price */}
                                                            <td className="py-3 text-center fw-semibold text-muted" style={{ fontSize: '14px' }}>
                                                                {formatPrice(itemPrice)}
                                                            </td>

                                                            {/* Quantity Stepper */}
                                                            <td className="py-3 text-center">
                                                                <div className="d-inline-flex align-items-center border rounded-pill bg-light p-1">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none fw-bold"
                                                                        onClick={() => updateQuantity(productId, (item.quantity || 1) - 1)}
                                                                        disabled={item.quantity <= 1}
                                                                        aria-label="Decrease quantity"
                                                                    >
                                                                        &minus;
                                                                    </button>
                                                                    <span className="px-2 fw-semibold" style={{ minWidth: '28px', fontSize: '13.5px' }}>
                                                                        {item.quantity}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none fw-bold"
                                                                        onClick={() => updateQuantity(productId, (item.quantity || 1) + 1)}
                                                                        aria-label="Increase quantity"
                                                                    >
                                                                        &#43;
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            {/* Item Total */}
                                                            <td className="py-3 text-end pe-4 fw-bold" style={{ color: '#1e3a8a', fontSize: '15px' }}>
                                                                {formatPrice(itemTotal)}
                                                            </td>

                                                            {/* Remove Button */}
                                                            <td className="py-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link text-danger p-1"
                                                                    onClick={() => removeFromCart(productId)}
                                                                    title="Remove from cart"
                                                                >
                                                                    <i className="bi bi-x-circle fs-5"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Table Footer actions */}
                                    <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center">
                                        <Link to="/Product" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
                                            <i className="bi bi-arrow-left me-1"></i> Continue Shopping
                                        </Link>
                                        <span className="text-muted small">
                                            <i className="bi bi-shield-check text-success me-1"></i> Safe & Secure Checkout
                                        </span>
                                    </div>
                                </div>

                                {/* Free Shipping Notification Bar */}
                                {subtotal < 499 ? (
                                    <div className="alert alert-info border-0 rounded-3 d-flex align-items-center gap-2 py-2 px-3 small">
                                        <i className="bi bi-truck fs-5"></i>
                                        <span>
                                            Add <strong>{formatPrice(499 - subtotal)}</strong> more of eligible items to get <strong>FREE Delivery</strong>!
                                        </span>
                                    </div>
                                ) : (
                                    <div className="alert alert-success border-0 rounded-3 d-flex align-items-center gap-2 py-2 px-3 small">
                                        <i className="bi bi-check-circle-fill fs-5"></i>
                                        <span>Congratulations! You have unlocked <strong>FREE Delivery</strong> on this order.</span>
                                    </div>
                                )}
                            </div>

                            {/* Summary Column */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '80px' }}>
                                    <h5 className="fw-bold mb-3" style={{ color: '#172033' }}>Order Summary</h5>

                                    {/* Price Breakdown */}
                                    <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '14px' }}>
                                        <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                                        <span className="fw-semibold text-dark">{formatPrice(subtotal)}</span>
                                    </div>

                                    <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '14px' }}>
                                        <span>Delivery Fee</span>
                                        <span>
                                            {shippingFee === 0 ? (
                                                <span className="text-success fw-bold">FREE</span>
                                            ) : (
                                                <span className="fw-semibold text-dark">{formatPrice(shippingFee)}</span>
                                            )}
                                        </span>
                                    </div>

                                    {discount > 0 && (
                                        <div className="d-flex justify-content-between text-success mb-2" style={{ fontSize: '14px' }}>
                                            <span>Coupon Discount ({coupon?.code})</span>
                                            <span className="fw-bold">-{formatPrice(discount)}</span>
                                        </div>
                                    )}

                                    {/* Coupon Input */}
                                    <div className="my-3 pt-3 border-top">
                                        {coupon ? (
                                            <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border">
                                                <div>
                                                    <span className="badge bg-success me-1">{coupon.code}</span>
                                                    <small className="text-muted">{coupon.label}</small>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-link text-danger p-0 text-decoration-none small fw-semibold"
                                                    onClick={removeCoupon}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleApplyCoupon} className="d-flex gap-2">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm text-uppercase"
                                                    placeholder="Promo Code (e.g. SPI10)"
                                                    value={couponInput}
                                                    onChange={(e) => setCouponInput(e.target.value)}
                                                />
                                                <button type="submit" className="btn btn-outline-dark btn-sm px-3 fw-semibold">
                                                    Apply
                                                </button>
                                            </form>
                                        )}
                                        {couponMsg.text && (
                                            <small className={`d-block mt-1 ${couponMsg.isError ? 'text-danger' : 'text-success'}`}>
                                                {couponMsg.text}
                                            </small>
                                        )}
                                    </div>

                                    {/* Grand Total */}
                                    <div className="d-flex justify-content-between align-items-center pt-3 border-top mb-4">
                                        <span className="fw-bold fs-5" style={{ color: '#172033' }}>Total Amount</span>
                                        <span className="fw-bold fs-4" style={{ color: '#1e3a8a' }}>{formatPrice(total)}</span>
                                    </div>

                                    {/* Checkout Button */}
                                    <button
                                        type="button"
                                        className="btn w-100 py-3 rounded-3 fw-bold text-white shadow"
                                        style={{ backgroundColor: '#ff4500', fontSize: '15px' }}
                                        onClick={() => navigate('/checkout')}
                                    >
                                        Proceed to Checkout <i className="bi bi-arrow-right ms-1"></i>
                                    </button>

                                    {/* Payment badges */}
                                    <div className="mt-4 pt-3 border-top text-center">
                                        <p className="text-muted mb-2" style={{ fontSize: '12px' }}>We accept all major payment methods</p>
                                        <div className="d-flex justify-content-center gap-2 flex-wrap text-secondary" style={{ fontSize: '20px' }}>
                                            <i className="bi bi-qr-code" title="UPI / QR"></i>
                                            <i className="bi bi-credit-card-2-front" title="Cards"></i>
                                            <i className="bi bi-bank" title="Net Banking"></i>
                                            <i className="bi bi-cash-stack" title="Cash on Delivery"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default Cart;
