const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');

const Router = express.Router();

// Create new order
Router.post('/create', async (req, res) => {
    try {
        const {
            userId,
            customer,
            shippingAddress,
            items,
            subtotal,
            shippingFee,
            discount,
            totalAmount,
            paymentMethod,
            paymentStatus,
            paymentDetails
        } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.mobile) {
            return res.status(400).json({ message: 'Valid delivery address is required' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Cart items are required to place an order' });
        }

        // Create new order record
        const order = new Order({
            userId: userId || '',
            customer: customer || {},
            shippingAddress,
            items: items.map(item => ({
                productId: String(item.id || item._id || item.productId || 'item'),
                name: item.title || item.name || 'Product',
                image: item.img || item.image || '',
                price: Number(item.priceValue ?? item.price ?? 0),
                quantity: Number(item.quantity || 1),
                category: item.category || ''
            })),
            subtotal: Number(subtotal || 0),
            shippingFee: Number(shippingFee || 0),
            discount: Number(discount || 0),
            totalAmount: Number(totalAmount || subtotal || 0),
            paymentMethod: paymentMethod || 'cod',
            paymentStatus: paymentStatus || (paymentMethod === 'cod' ? 'Pending' : 'Completed'),
            paymentDetails: paymentDetails || {},
            orderStatus: 'Placed'
        });

        const savedOrder = await order.save();

        // Optionally decrement stock in Product collection if matching
        try {
            for (const item of items) {
                const prodId = item.id || item._id;
                if (prodId && !String(prodId).startsWith('catalog-')) {
                    await Product.findByIdAndUpdate(prodId, {
                        $inc: { stock: -Number(item.quantity || 1) }
                    });
                }
            }
        } catch (stockErr) {
            console.error('Stock decrement notice:', stockErr.message);
        }

        return res.status(201).json({
            message: 'Order placed successfully',
            order: savedOrder
        });
    } catch (err) {
        console.error('Order creation error:', err);
        return res.status(500).json({ message: err.message || 'Failed to place order' });
    }
});

// Get all orders (for Admin Dashboard)
Router.get('/all', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        return res.json(orders);
    } catch (err) {
        console.error('Failed to fetch all orders:', err);
        return res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Get orders by userId
Router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        return res.json(orders);
    } catch (err) {
        console.error('Failed to fetch user orders:', err);
        return res.status(500).json({ message: 'Failed to fetch user orders' });
    }
});

// Get single order by id or orderId
Router.get('/:id', async (req, res) => {
    try {
        let order = null;
        if (req.params.id.startsWith('SPI-')) {
            order = await Order.findOne({ orderId: req.params.id });
        } else {
            order = await Order.findById(req.params.id);
        }

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.json(order);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid order identifier' });
    }
});

// Update order status (Admin or cancellation)
Router.patch('/status/:id', async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        const allowedStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (orderStatus && !allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }
        const updateData = {};
        if (orderStatus) updateData.orderStatus = orderStatus;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;

        let order = null;
        if (req.params.id.startsWith('SPI-')) {
            order = await Order.findOne({ orderId: req.params.id });
        } else {
            order = await Order.findById(req.params.id);
        }

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (orderStatus === 'Cancelled' && (order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled')) {
            return res.status(409).json({ message: 'A delivered order cannot be cancelled' });
        }
        if (orderStatus && order.orderStatus === 'Cancelled') {
            return res.status(409).json({ message: 'A cancelled order cannot be changed' });
        }

        if (Object.keys(updateData).length > 0) {
            Object.assign(order, updateData);
            await order.save();
        }

        return res.json({ message: 'Order status updated successfully', order });
    } catch (err) {
        return res.status(500).json({ message: err.message || 'Failed to update order status' });
    }
});

module.exports = Router;
