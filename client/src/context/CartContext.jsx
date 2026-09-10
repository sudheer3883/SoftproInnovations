import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

const toNumber = (value) => {
    if (typeof value === 'number') return value;
    return Number(String(value ?? 0).replace(/[^0-9.-]/g, '')) || 0;
};

const normalizeCartItem = (product, quantity = 1) => {
    const id = String(product.id || product._id || product.productId || `item-${Date.now()}`);
    const price = toNumber(product.priceValue ?? product.price);
    const originalPrice = toNumber(product.originalPriceValue ?? product.originalPrice) || price;
    const title = product.title || product.name || 'Product';
    const img = product.img || product.image || product.galleryImages?.[0] || '';
    const category = product.category || 'Components';
    const inStock = product.inStock !== false && (product.stock === undefined || Number(product.stock) > 0);

    return {
        id,
        _id: id,
        title,
        name: title,
        price,
        priceValue: price,
        originalPrice,
        img,
        image: img,
        category,
        inStock,
        stock: product.stock !== undefined ? Number(product.stock) : 99,
        brand: product.brand || '',
        quantity: Math.max(1, Number(quantity) || 1)
    };
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const stored = localStorage.getItem('cart');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [toast, setToast] = useState(null);
    const [coupon, setCoupon] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('appliedCoupon') || 'null');
        } catch {
            return null;
        }
    });

    // Keep localStorage synced whenever cart changes
    useEffect(() => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (e) {
            console.error('Failed to sync cart to localStorage', e);
        }
    }, [cart]);

    // Toast auto-hide
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            setToast(null);
        }, 3200);
        return () => clearTimeout(timer);
    }, [toast]);

    const addToCart = useCallback((product, qty = 1, showToast = true) => {
        if (!product) return;
        const normalized = normalizeCartItem(product, qty);

        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex(
                (item) => String(item.id || item._id) === normalized.id
            );

            if (existingIndex > -1) {
                const updated = [...prevCart];
                const currentQty = updated[existingIndex].quantity || 1;
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: currentQty + normalized.quantity
                };
                return updated;
            } else {
                return [...prevCart, normalized];
            }
        });

        if (showToast) {
            setToast({
                message: `${normalized.title} added to cart!`,
                type: 'success',
                image: normalized.img
            });
        }
    }, []);

    const buyNow = useCallback((product, qty = 1) => {
        if (!product) return;
        setCart([normalizeCartItem(product, qty)]);
        setCoupon(null);
        localStorage.removeItem('appliedCoupon');
    }, []);

    const updateQuantity = useCallback((id, newQty) => {
        const qty = Math.max(1, Number(newQty) || 1);
        setCart((prev) =>
            prev.map((item) =>
                String(item.id || item._id) === String(id)
                    ? { ...item, quantity: qty }
                    : item
            )
        );
    }, []);

    const removeFromCart = useCallback((id) => {
        setCart((prev) => {
            const itemToRemove = prev.find((item) => String(item.id || item._id) === String(id));
            if (itemToRemove) {
                setToast({
                    message: `Removed ${itemToRemove.title || itemToRemove.name} from cart`,
                    type: 'info'
                });
            }
            return prev.filter((item) => String(item.id || item._id) !== String(id));
        });
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        setCoupon(null);
        localStorage.removeItem('cart');
        localStorage.removeItem('appliedCoupon');
    }, []);

    const applyCoupon = useCallback((code) => {
        const cleanCode = (code || '').trim().toUpperCase();
        if (cleanCode === 'SPI10' || cleanCode === 'DISCOUNT10') {
            const couponObj = { code: cleanCode, rate: 0.1, label: '10% OFF' };
            setCoupon(couponObj);
            localStorage.setItem('appliedCoupon', JSON.stringify(couponObj));
            setToast({ message: 'Coupon SPI10 applied! 10% discount applied.', type: 'success' });
            return { success: true, message: '10% discount applied successfully!' };
        } else if (cleanCode === 'WELCOME50' || cleanCode === 'SAVE50') {
            const couponObj = { code: cleanCode, flat: 50, label: '₹50 FLAT OFF' };
            setCoupon(couponObj);
            localStorage.setItem('appliedCoupon', JSON.stringify(couponObj));
            setToast({ message: 'Coupon applied! ₹50 off.', type: 'success' });
            return { success: true, message: '₹50 flat discount applied successfully!' };
        } else {
            return { success: false, message: 'Invalid coupon code. Try "SPI10" or "SAVE50".' };
        }
    }, []);

    const removeCoupon = useCallback(() => {
        setCoupon(null);
        localStorage.removeItem('appliedCoupon');
        setToast({ message: 'Coupon removed', type: 'info' });
    }, []);

    // Derived statistics
    const cartCount = useMemo(() => {
        return cart.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
    }, [cart]);

    const subtotal = useMemo(() => {
        return cart.reduce((total, item) => {
            const price = toNumber(item.priceValue ?? item.price);
            const qty = Number(item.quantity) || 1;
            return total + price * qty;
        }, 0);
    }, [cart]);

    const shippingFee = useMemo(() => {
        if (subtotal === 0) return 0;
        return subtotal >= 499 ? 0 : 49;
    }, [subtotal]);

    const discount = useMemo(() => {
        if (!coupon || subtotal === 0) return 0;
        if (coupon.rate) return Math.round(subtotal * coupon.rate);
        if (coupon.flat) return Math.min(subtotal, coupon.flat);
        return 0;
    }, [coupon, subtotal]);

    const total = useMemo(() => {
        if (subtotal === 0) return 0;
        return Math.max(0, subtotal + shippingFee - discount);
    }, [subtotal, shippingFee, discount]);

    return (
        <CartContext.Provider
            value={{
                cart,
                cartCount,
                addToCart,
                buyNow,
                updateQuantity,
                removeFromCart,
                clearCart,
                subtotal,
                shippingFee,
                coupon,
                discount,
                total,
                applyCoupon,
                removeCoupon,
                toast,
                setToast
            }}
        >
            {children}
            {toast && (
                <div className="cart-toast-banner shadow-lg animate-fade-in" role="alert">
                    {toast.image && (
                        <img src={toast.image} alt="" className="cart-toast-img" />
                    )}
                    <div className="cart-toast-content">
                        <span className="cart-toast-title">
                            {toast.type === 'success' ? '✓ ' : 'ℹ '}
                            {toast.message}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="cart-toast-close"
                        onClick={() => setToast(null)}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
            )}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;
