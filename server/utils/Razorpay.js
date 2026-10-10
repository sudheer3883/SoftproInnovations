const Razorpay = require('razorpay');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('⚠️ Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing in environment variables.');
  razorpayInstance = {
    orders: {
      create: async () => {
        throw new Error('Razorpay credentials not configured on the server.');
      }
    }
  };
} else {
  try {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  } catch (err) {
    console.warn('⚠️ Razorpay initialization warning:', err.message);
    razorpayInstance = {
      orders: {
        create: async () => {
          throw new Error('Razorpay credentials not valid.');
        }
      }
    };
  }
}

module.exports = razorpayInstance;
