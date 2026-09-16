const crypto = require("crypto");
const nodemailer = require("nodemailer");

const createOtp = () => crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

let transporter;

const getTransporter = () => {
    if (transporter) return transporter;

    const smtpUser = String(process.env.SMTP_USER || '').trim();
    const smtpPassword = String(process.env.SMTP_PASS || '').replace(/\s/g, '');
    if (!smtpUser || !smtpPassword) {
        throw new Error("Gmail SMTP is not configured. Add SMTP_USER and a Gmail App Password as SMTP_PASS in server/.env.");
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE || "true") === "true",
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });

    return transporter;
};

const sendDeliveryOtp = async ({ email, otp, orderId }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required before delivery");
    }

    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Delivery OTP for order ${orderId}`,
        text: `Your Softpro Innovation delivery OTP is ${otp}. It is valid for 15 minutes. Order: ${orderId}. Do not share this OTP.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h2>Delivery verification</h2><p>Your OTP for order <strong>${orderId}</strong> is:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#3945e0">${otp}</p><p>This OTP is valid for 15 minutes. Do not share it with anyone.</p><p>Softpro Innovation</p></div>`,
    });
};

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendOrderStatusEmail = async ({ email, orderId, status, order }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for order updates");
    }

    const customerName = escapeHtml(order?.customer?.name || order?.shippingAddress?.fullName || "there");
    const safeOrderId = escapeHtml(orderId);
    const statusLabel = status === "Placed" ? "Confirmed" : status;
    const safeStatus = escapeHtml(statusLabel);
    const orderDate = order?.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");
    const paymentMethod = escapeHtml(order?.paymentMethod || "COD");
    const paymentStatus = escapeHtml(order?.paymentStatus || "Pending");
    const total = Number(order?.totalAmount || 0).toLocaleString("en-IN");
    const items = Array.isArray(order?.items) ? order.items : [];
    const itemRows = items.length
        ? items.map((item) => `<tr><td style="padding:12px 10px;border-bottom:1px solid #edf1f6;color:#172033">${escapeHtml(item.name || "Product")}</td><td style="padding:12px 10px;border-bottom:1px solid #edf1f6;text-align:center;color:#52657e">${Number(item.quantity || 1)}</td><td style="padding:12px 10px;border-bottom:1px solid #edf1f6;text-align:right;color:#172033">₹${Number(item.price || 0).toLocaleString("en-IN")}</td></tr>`).join("")
        : `<tr><td colspan="3" style="padding:12px 10px;color:#52657e">Order details are available in your account.</td></tr>`;

    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Order ${statusLabel} - ${orderId} | SoftproInnovation`,
        text: `Hi ${customerName}, your Softpro Innovation order ${orderId} is now ${statusLabel}. Order date: ${orderDate}. Payment: ${paymentMethod} (${paymentStatus}). Total: ₹${total}.`,
        html: `<div style="margin:0;background:#f2f5f9;padding:24px 12px;font-family:Arial,sans-serif;color:#172033"><div style="max-width:620px;margin:auto;background:#fff;border:1px solid #e1e7ef;border-radius:10px;overflow:hidden"><div style="padding:28px 24px;background:linear-gradient(115deg,#06d9ea,#5a42f5 58%,#ff00c8);color:#fff;text-align:center"><h1 style="margin:0;font-size:24px;letter-spacing:-.4px">Order ${safeStatus} ✓</h1><p style="margin:9px 0 0;font-size:13px;opacity:.92">SoftproInnovation</p></div><div style="padding:26px 24px"><h2 style="margin:0 0 12px;font-size:20px;color:#172033">Hi ${customerName},</h2><p style="margin:0 0 20px;color:#52657e;line-height:1.6">Your order status has been updated. Here are your latest order details.</p><div style="display:flex;flex-wrap:wrap;background:#f7f9fc;border:1px solid #e8edf3;border-radius:8px;padding:14px 12px;margin-bottom:22px"><div style="width:50%;padding:5px 8px;color:#52657e;font-size:12px">ORDER ID<br><strong style="color:#172033;font-size:13px">${safeOrderId}</strong></div><div style="width:50%;padding:5px 8px;color:#52657e;font-size:12px">ORDER DATE<br><strong style="color:#172033;font-size:13px">${orderDate}</strong></div><div style="width:50%;padding:5px 8px;color:#52657e;font-size:12px">PAYMENT<br><strong style="color:#172033;font-size:13px;text-transform:capitalize">${paymentMethod} · ${paymentStatus}</strong></div><div style="width:50%;padding:5px 8px;color:#52657e;font-size:12px">TOTAL<br><strong style="color:#172033;font-size:13px">₹${total}</strong></div></div><h3 style="margin:0 0 10px;font-size:15px;color:#172033">Order Details</h3><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#eef4ff"><th style="padding:10px;text-align:left;color:#24466f">Product</th><th style="padding:10px;text-align:center;color:#24466f">Qty</th><th style="padding:10px;text-align:right;color:#24466f">Price</th></tr></thead><tbody>${itemRows}</tbody></table><a href="${process.env.CLIENT_URL || "http://localhost:5173"}/profile/orders" style="display:inline-block;margin-top:24px;padding:12px 20px;border-radius:6px;background:#315be8;color:#fff;text-decoration:none;font-weight:700;font-size:13px">View Orders</a><p style="margin:24px 0 0;color:#52657e;font-size:13px;line-height:1.6">Thank you for choosing Softpro Innovation.</p></div></div></div>`,
    });
};

const sendOrderActivityEmail = async ({ email, orderId, status, order }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for order updates");
    }

    const customerName = escapeHtml(order?.customer?.name || order?.shippingAddress?.fullName || "there");
    const safeOrderId = escapeHtml(orderId);
    const statusLabel = status === "Placed" ? "Confirmed" : status;
    const safeStatus = escapeHtml(statusLabel);
    const orderDate = order?.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");
    const paymentMethod = escapeHtml(order?.paymentMethod || "COD");
    const paymentStatus = escapeHtml(order?.paymentStatus || "Pending");
    const total = Number(order?.totalAmount || 0).toLocaleString("en-IN");
    const items = Array.isArray(order?.items) ? order.items : [];
    const itemRows = items.length
        ? items.map((item) => `<tr><td style="padding:10px 8px;border-bottom:1px solid #e8edf3;color:#172033;word-break:break-word">${escapeHtml(item.name || "Product")}</td><td style="width:48px;padding:10px 8px;border-bottom:1px solid #e8edf3;text-align:center;color:#52657e">${Number(item.quantity || 1)}</td><td style="width:78px;padding:10px 8px;border-bottom:1px solid #e8edf3;text-align:right;color:#172033;white-space:nowrap">₹${Number(item.price || 0).toLocaleString("en-IN")}</td></tr>`).join("")
        : `<tr><td colspan="3" style="padding:10px 8px;color:#52657e">Order details are available in your account.</td></tr>`;
    const clientUrl = escapeHtml(process.env.CLIENT_URL || "http://localhost:5173");

    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Order ${statusLabel} - ${orderId} | SoftproInnovation`,
        text: `Hi ${customerName}, your Softpro Innovation order ${orderId} is now ${statusLabel}. Order date: ${orderDate}. Payment: ${paymentMethod} (${paymentStatus}). Total: ₹${total}.`,
        html: `<div style="margin:0;background:#f2f5f9;padding:16px 8px;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e1e7ef;border-radius:10px;overflow:hidden"><tr><td style="padding:24px 18px;background:linear-gradient(115deg,#06d9ea,#5a42f5 58%,#ff00c8);color:#fff;text-align:center"><h1 style="margin:0;font-size:22px;line-height:1.25">Order ${safeStatus} ✓</h1><p style="margin:8px 0 0;font-size:12px">SoftproInnovation</p></td></tr><tr><td style="padding:22px 16px"><h2 style="margin:0 0 10px;font-size:19px;color:#172033">Hi ${customerName},</h2><p style="margin:0 0 18px;color:#52657e;line-height:1.55;font-size:14px">Your order status has been updated. Here are your latest order details.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border:1px solid #e8edf3;border-radius:8px;margin-bottom:20px"><tr><td width="50%" style="padding:10px 9px;color:#52657e;font-size:11px;vertical-align:top">ORDER ID<br><strong style="display:block;color:#172033;font-size:12px;line-height:1.35;word-break:break-word">${safeOrderId}</strong></td><td width="50%" style="padding:10px 9px;color:#52657e;font-size:11px;vertical-align:top">ORDER DATE<br><strong style="display:block;color:#172033;font-size:12px;line-height:1.35">${orderDate}</strong></td></tr><tr><td width="50%" style="padding:10px 9px;color:#52657e;font-size:11px;vertical-align:top">PAYMENT<br><strong style="display:block;color:#172033;font-size:12px;line-height:1.35;text-transform:capitalize;word-break:break-word">${paymentMethod} · ${paymentStatus}</strong></td><td width="50%" style="padding:10px 9px;color:#52657e;font-size:11px;vertical-align:top">TOTAL<br><strong style="display:block;color:#172033;font-size:12px;line-height:1.35;white-space:nowrap">₹${total}</strong></td></tr></table><h3 style="margin:0 0 9px;font-size:15px;color:#172033">Order Details</h3><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;font-size:12px"><tr style="background:#eef4ff"><th style="padding:9px 8px;text-align:left;color:#24466f;font-weight:700">Product</th><th width="48" style="padding:9px 4px;text-align:center;color:#24466f;font-weight:700">Qty</th><th width="78" style="padding:9px 4px;text-align:right;color:#24466f;font-weight:700">Price</th></tr>${itemRows}</table><a href="${clientUrl}/profile/orders" style="display:inline-block;margin-top:21px;padding:11px 18px;border-radius:6px;background:#315be8;color:#fff;text-decoration:none;font-weight:700;font-size:12px">View Orders</a><p style="margin:22px 0 0;color:#52657e;font-size:12px;line-height:1.55">Thank you for choosing Softpro Innovation.</p></td></tr></table></div>`,
    });
};

const sendPaymentStatusEmail = async ({ email, orderId, paymentStatus }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for payment updates");
    }

    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Payment ${paymentStatus} for order ${orderId}`,
        text: `Payment for your Softpro Innovation order ${orderId} is ${paymentStatus}.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h2>Payment update</h2><p>Payment for order <strong>${orderId}</strong> is now <strong>${paymentStatus}</strong>.</p><p>Softpro Innovation</p></div>`,
    });
};

const sendWelcomeEmail = async ({ email, name }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for registration");
    }

    const displayName = escapeHtml(String(name || "there").trim() || "there");
    const safeEmail = escapeHtml(email);
    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Welcome to Softpro Innovation",
        text: `Welcome, ${displayName}! Thank you for registering with Softpro Innovation. Your account has been created successfully.`,
        html: `<div style="margin:0;background:#f3f6fa;padding:28px 16px;font-family:Arial,sans-serif;color:#172033"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e3e8ef;border-radius:10px;overflow:hidden"><div style="background:#101827;padding:30px 24px;color:#fff"><h1 style="margin:0;font-size:25px;letter-spacing:-.4px">SoftproInnovation</h1><p style="margin:8px 0 0;color:#c7d2e2;font-size:13px">Your Shopping. Your Choice.</p></div><div style="padding:30px 24px"><h2 style="margin:0 0 16px;font-size:22px;color:#172033">Welcome, ${displayName}!</h2><p style="font-size:15px;line-height:1.7;color:#52657e">Thank you for registering with <strong style="color:#172033">Softpro Innovation</strong>. Your account has been created successfully.</p><p style="font-size:15px;line-height:1.7;color:#52657e">You can now explore our products, save your details, and track your orders from your account.</p><div style="margin-top:24px;padding:14px 16px;background:#f0f6ff;border-left:4px solid #2f6fed;color:#24466f;font-size:14px">Your registered email: <strong>${safeEmail}</strong></div><p style="margin:26px 0 0;color:#52657e;font-size:14px">Thank you for choosing Softpro Innovation.</p></div></div></div>`,
    });
};

const sendPasswordResetOtp = async ({ email, otp }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for password reset");
    }

    const info = await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your Softpro Innovation password reset OTP",
        text: `Your password reset OTP is ${otp}. It is valid for 10 minutes. Do not share it with anyone.`,
        html: `<div style="margin:0;background:#f3f6fa;padding:28px 16px;font-family:Arial,sans-serif;color:#172033"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e3e8ef;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(110deg,#173b91,#3945e0);padding:26px 24px;color:#fff"><h1 style="margin:0;font-size:24px">SoftproInnovation</h1><p style="margin:8px 0 0;color:#dbe7ff;font-size:13px">Password reset verification</p></div><div style="padding:28px 24px"><h2 style="margin:0 0 12px;font-size:21px">Reset your password</h2><p style="color:#52657e;line-height:1.6">Use this one-time password to continue:</p><p style="margin:22px 0;text-align:center;font-size:34px;letter-spacing:8px;font-weight:800;color:#f97316">${otp}</p><p style="color:#52657e;font-size:13px">This OTP expires in 10 minutes. If you did not request this, you can ignore this email.</p></div></div></div>`,
    });

    return info.messageId;
};

module.exports = { createOtp, hashOtp, sendDeliveryOtp, sendOrderStatusEmail, sendOrderActivityEmail, sendPaymentStatusEmail, sendWelcomeEmail, sendPasswordResetOtp };