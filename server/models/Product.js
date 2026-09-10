const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    sku: {
        type: String,
        unique: true,
        select: false,
        default: () => `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    galleryImages: {
        type: [String],
        default: []
    },
    dimensions: {
        height: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        depth: { type: Number, min: 0 },
        unit: { type: String, enum: ['mm', 'cm', 'in'], default: 'mm' }
    },
    weight: {
        type: Number,
        min: 0
    },
    shippingClass: {
        type: String,
        default: 'Standard'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);