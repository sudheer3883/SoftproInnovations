const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const razorpay = require('../utils/Razorpay');
const { sendPaymentStatusEmail } = require('../services/deliveryOtp');

const Router = express.Router();
const PAYU_KEY = process.env.PAYU_KEY || process.env.PAYU_MERCHANT_KEY;
const PAYU_SALT = process.env.PAYU_SALT || process.env.PAYU_MERCHANT_SALT;
const PAYU_MODE = String(process.env.PAYU_MODE || 'test').toLowerCase();
const PAYU_PAYMENT_URL = PAYU_MODE === 'live'
  ? 'https://secure.payu.in/_payment'
  : 'https://test.payu.in/_payment';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.SERVER_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000';

const createPayUHash = ({ key, txnid, amount, productinfo, firstname, email, udf1 = '' }) => {
  const hashString = [
    key, txnid, amount, productinfo, firstname, email, udf1,
    '', '', '', '', '', '', '', '', '',
    PAYU_SALT,
  ].join('|');
  return crypto.createHash('sha512').update(hashString).digest('hex');
};

const verifyPayUResponse = (body) => {
  const reverseHashString = [
    PAYU_SALT, body.status || '',
    body.udf5 || '', body.udf4 || '', body.udf3 || '', body.udf2 || '', body.udf1 || '',
    body.email || '', body.firstname || '', body.productinfo || '', body.amount || '',
    body.txnid || '', body.key || '',
  ].join('|');
  const hashInput = body.additionalCharges
    ? `${body.additionalCharges}|${reverseHashString}`
    : reverseHashString;
  const expectedHash = crypto.createHash('sha512').update(hashInput).digest('hex');
  return expectedHash === String(body.hash || '').toLowerCase();
};

Router.post('/payu/initiate', async (req, res) => {
  try {
    const { orderId, amount, productinfo, firstname, email, phone, paymentMethod } = req.body;
    if (!PAYU_KEY || !PAYU_SALT) {
      return res.status(503).json({ message: 'PayU sandbox keys are not configured on the server.' });
    }
    if (!orderId || Number(amount) <= 0 || !firstname || !email || !phone) {
      return res.status(400).json({ message: 'Valid order and customer details are required.' });
    }

    const fields = {
      key: PAYU_KEY,
      txnid: String(orderId),
      amount: Number(amount).toFixed(2),
      productinfo: productinfo || 'Softpro Innovation Order',
      firstname: String(firstname).slice(0, 100),
      email: String(email).slice(0, 100),
      phone: String(phone).replace(/\D/g, '').slice(-10),
      udf1: String(orderId),
      surl: `${BACKEND_URL}/api/payment/payu/callback`,
      furl: `${BACKEND_URL}/api/payment/payu/callback`,
      pg: paymentMethod === 'card' ? 'CC' : paymentMethod === 'netbanking' ? 'NB' : 'UPI',
    };
    fields.hash = createPayUHash(fields);
    return res.json({ action: PAYU_PAYMENT_URL, fields });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to start PayU payment.' });
  }
});

Router.post('/payu/callback', async (req, res) => {
  const body = req.body || {};
  const orderId = body.udf1 || body.txnid;
  const success = String(body.status || '').toLowerCase() === 'success' && verifyPayUResponse(body);

  try {
    const order = await Order.findOne({ orderId });
    if (order) {
      order.paymentStatus = success ? 'Completed' : 'Failed';
      if (!success) order.orderStatus = 'Cancelled';
      order.paymentDetails.transactionId = body.mihpayid || body.txnid || '';
      await order.save();
      try {
        await sendPaymentStatusEmail({
          email: String(order.customer?.email || '').trim().toLowerCase(),
          orderId: order.orderId,
          paymentStatus: order.paymentStatus
        });
      } catch (emailError) {
        console.error('PayU payment email failed:', emailError.message);
      }
    }
  } catch (error) {
    console.error('PayU callback order update failed:', error.message);
  }

  const target = success
    ? `${FRONTEND_URL}/order-success/${encodeURIComponent(orderId)}?payment=success`
    : `${FRONTEND_URL}/checkout?payment=failed&orderId=${encodeURIComponent(orderId)}`;
  return res.redirect(target);
});

// ==========================================
// RAZORPAY PAYMENT ENDPOINTS
// ==========================================

// Get Razorpay Key Id for client
Router.get('/razorpay/key', (req, res) => {
  return res.json({ key: process.env.RAZORPAY_KEY_ID || '' });
});

// Create Razorpay Order
Router.post('/razorpay/create-order', async (req, res) => {
  try {
    const { amount, orderId, notes } = req.body;
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Razorpay keys not configured on server.' });
    }

    const options = {
      amount: Math.round(numericAmount * 100), // amount in paise
      currency: 'INR',
      receipt: `rcpt_${String(orderId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '').slice(-30)}`,
      notes: {
        orderId: String(orderId || ''),
        ...(notes || {})
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return res.status(500).json({
      success: false,
      message: error?.error?.description || error.message || 'Failed to create Razorpay order'
    });
  }
});

// Verify Razorpay Payment Signature
Router.post('/razorpay/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment confirmation parameters.'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key not configured on server.'
      });
    }

    const signPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(signPayload)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      let order = null;
      if (orderId) {
        order = await Order.findOne({ orderId: String(orderId) });

        if (order) {
          order.paymentStatus = 'Completed';
          order.orderStatus = 'Placed';
          order.paymentDetails.transactionId = razorpay_payment_id;
          order.paymentDetails.razorpayOrderId = razorpay_order_id;
          order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
          order.paymentDetails.razorpaySignature = razorpay_signature;
          await order.save();
          try {
            await sendPaymentStatusEmail({
              email: String(order.customer?.email || '').trim().toLowerCase(),
              orderId: order.orderId,
              paymentStatus: order.paymentStatus
            });
          } catch (emailError) {
            console.error('Razorpay payment email failed:', emailError.message);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        order
      });
    } else {
      if (orderId) {
        const order = await Order.findOne({ orderId: String(orderId) });
        if (order) {
          order.paymentStatus = 'Failed';
          await order.save();
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }
  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
});

module.exports = Router;
