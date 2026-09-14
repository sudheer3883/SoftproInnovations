const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('⚠️ Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing in environment variables.');
}

const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId || '',
  key_secret: razorpayKeySecret || '',
});

module.exports = razorpayInstance;
