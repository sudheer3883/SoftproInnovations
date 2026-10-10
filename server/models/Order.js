const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    category: {
        type: String,
        default: ''
    }
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    landmark: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'Home'
    }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        default: () => `SPI-ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`
    },
    userId: {
        type: String,
        default: ''
    },
    customer: {
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        mobile: { type: String, default: '' }
    },
    shippingAddress: {
        type: ShippingAddressSchema,
        required: true
    },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: [v => Array.isArray(v) && v.length > 0, 'Order must contain at least one item']
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'upi', 'card', 'netbanking', 'razorpay'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
        default: 'Completed'
    },
    paymentDetails: {
        transactionId: { type: String, default: '' },
        upiId: { type: String, default: '' },
        cardLast4: { type: String, default: '' },
        bankName: { type: String, default: '' },
        razorpayOrderId: { type: String, default: '' },
        razorpayPaymentId: { type: String, default: '' },
        razorpaySignature: { type: String, default: '' }
    },
        orderStatus: {
            type: String,
            enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Placed'
        },
    estimatedDelivery: {
        type: Date,
        default: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    },
    deliveryOtp: {
        hash: { type: String, default: '' },
        expiresAt: { type: Date, default: null },
        sentAt: { type: Date, default: null },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
