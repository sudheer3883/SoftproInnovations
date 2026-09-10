const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');

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
    }
  } catch (error) {
    console.error('PayU callback order update failed:', error.message);
  }

  const target = success
    ? `${FRONTEND_URL}/order-success/${encodeURIComponent(orderId)}?payment=success`
    : `${FRONTEND_URL}/checkout?payment=failed&orderId=${encodeURIComponent(orderId)}`;
  return res.redirect(target);
});

module.exports = Router;
