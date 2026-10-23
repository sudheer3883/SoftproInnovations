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

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const isGmail = host.toLowerCase().includes("gmail");

    if (isGmail) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: smtpUser,
                pass: smtpPassword,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    } else {
        transporter = nodemailer.createTransport({
            host: host,
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
    }

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
    return sendOrderActivityEmail({ email, orderId, status, order });
};

const sendOrderActivityEmail = async ({ email, orderId, status, order }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for order updates");
    }

    const customerName = escapeHtml(order?.customer?.name || order?.shippingAddress?.fullName || "Valued Customer");
    const safeOrderId = escapeHtml(orderId);
    const statusLabel = status === "Placed" ? "Confirmed" : status;
    const safeStatus = escapeHtml(statusLabel);
    const orderDate = order?.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const paymentMethod = escapeHtml(String(order?.paymentMethod || "COD").toUpperCase());
    const paymentStatus = escapeHtml(order?.paymentStatus || "Pending");
    const total = Number(order?.totalAmount || 0).toLocaleString("en-IN");
    const items = Array.isArray(order?.items) ? order.items : [];
    const shippingAddress = order?.shippingAddress;
    const addressStr = shippingAddress
        ? escapeHtml([shippingAddress.fullName, shippingAddress.address, shippingAddress.landmark, shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(", "))
        : "";

    const statusBadgeColor = status === "Delivered" ? "#16a34a" : status === "Cancelled" ? "#dc2626" : status === "Shipped" ? "#2563eb" : "#f97316";

    const subjectMap = {
        Placed: `Order Confirmed: #${orderId} | Softpro Innovation`,
        Confirmed: `Order Confirmed: #${orderId} | Softpro Innovation`,
        Processing: `Order Processing: #${orderId} | Softpro Innovation`,
        Shipped: `Order Shipped 🚚: #${orderId} | Softpro Innovation`,
        Delivered: `Order Delivered 🎉: #${orderId} | Softpro Innovation`,
        Cancelled: `Order Cancelled: #${orderId} | Softpro Innovation`,
    };
    const emailSubject = subjectMap[status] || `Order Update (${statusLabel}): #${orderId} | Softpro Innovation`;

    const itemRows = items.length
        ? items.map((item) => `<tr><td style="padding:10px 8px;border-bottom:1px solid #e8edf3;color:#172033;word-break:break-word">${escapeHtml(item.name || "Product")}</td><td style="width:48px;padding:10px 8px;border-bottom:1px solid #e8edf3;text-align:center;color:#52657e">${Number(item.quantity || 1)}</td><td style="width:84px;padding:10px 8px;border-bottom:1px solid #e8edf3;text-align:right;color:#172033;white-space:nowrap">₹${Number(item.price || 0).toLocaleString("en-IN")}</td></tr>`).join("")
        : `<tr><td colspan="3" style="padding:10px 8px;color:#52657e">Order details are available in your account.</td></tr>`;
    const clientUrl = escapeHtml(process.env.CLIENT_URL || "http://localhost:5173");

    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: emailSubject,
        text: `Hi ${customerName}, your Softpro Innovation order #${orderId} is now ${statusLabel}. Date: ${orderDate}. Payment: ${paymentMethod} (${paymentStatus}). Total: ₹${total}. Track in your account: ${clientUrl}/profile/orders`,
        html: `<div style="margin:0;background:#f3f6fa;padding:20px 10px;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.04)">
  <tr>
    <td style="padding:28px 24px;background:linear-gradient(135deg,#0b1e3b 0%,#1e3a8a 60%,#3b82f6 100%);color:#ffffff;text-align:center">
      <h2 style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px">Softpro<span style="color:#ff6b35">Innovation</span></h2>
      <div style="margin-top:10px;display:inline-block;padding:5px 14px;background:${statusBadgeColor};color:#ffffff;font-size:12px;font-weight:700;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase">
        Order ${safeStatus}
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:26px 22px">
      <h3 style="margin:0 0 8px;font-size:18px;color:#0f172a">Hi ${customerName},</h3>
      <p style="margin:0 0 20px;color:#64748b;line-height:1.55;font-size:14px">
        ${status === 'Cancelled' ? 'Your order has been cancelled.' : status === 'Delivered' ? 'Great news! Your order has been delivered successfully.' : status === 'Shipped' ? 'Your package has been dispatched and is on its way to you.' : 'Thank you for your order! Here are your latest order details.'}
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:22px">
        <tr>
          <td width="50%" style="padding:10px 12px;color:#64748b;font-size:11px;vertical-align:top">
            ORDER ID<br><strong style="display:block;color:#0f172a;font-size:13px;line-height:1.4;word-break:break-word">${safeOrderId}</strong>
          </td>
          <td width="50%" style="padding:10px 12px;color:#64748b;font-size:11px;vertical-align:top">
            ORDER DATE<br><strong style="display:block;color:#0f172a;font-size:13px;line-height:1.4">${orderDate}</strong>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:10px 12px;color:#64748b;font-size:11px;vertical-align:top">
            PAYMENT<br><strong style="display:block;color:#0f172a;font-size:13px;line-height:1.4">${paymentMethod} (${paymentStatus})</strong>
          </td>
          <td width="50%" style="padding:10px 12px;color:#64748b;font-size:11px;vertical-align:top">
            TOTAL AMOUNT<br><strong style="display:block;color:#1e3a8a;font-size:15px;line-height:1.4;font-weight:800">₹${total}</strong>
          </td>
        </tr>
        ${addressStr ? `<tr><td colspan="2" style="padding:10px 12px;border-top:1px solid #edf2f7;color:#64748b;font-size:11px">DELIVERY ADDRESS<br><span style="display:block;color:#1e293b;font-size:12px;line-height:1.4">${addressStr}</span></td></tr>` : ''}
      </table>

      <h4 style="margin:0 0 10px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px">Order Summary</h4>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;font-size:12px">
        <tr style="background:#eef2ff">
          <th style="padding:9px 8px;text-align:left;color:#1e3a8a;font-weight:700">Product</th>
          <th width="48" style="padding:9px 4px;text-align:center;color:#1e3a8a;font-weight:700">Qty</th>
          <th width="84" style="padding:9px 4px;text-align:right;color:#1e3a8a;font-weight:700">Price</th>
        </tr>
        ${itemRows}
      </table>

      <div style="text-align:center;margin-top:24px">
        <a href="${clientUrl}/profile/orders" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#1e3a8a;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.3px">
          View & Track Orders
        </a>
      </div>

      <p style="margin:26px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center">
        Questions? Contact us at <a href="mailto:rsk205096@gmail.com" style="color:#1e3a8a;text-decoration:none">rsk205096@gmail.com</a> or call +91 8299403883.<br>
        Thank you for choosing Softpro Innovation.
      </p>
    </td>
  </tr>
</table>
</div>`,
    });
};

const sendPaymentStatusEmail = async ({ email, orderId, paymentStatus }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for payment updates");
    }

    const safeOrderId = escapeHtml(orderId);
    const safeStatus = escapeHtml(paymentStatus);
    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Payment ${paymentStatus}: Order #${orderId} | Softpro Innovation`,
        text: `Payment for your Softpro Innovation order #${orderId} is now ${paymentStatus}.`,
        html: `<div style="margin:0;background:#f3f6fa;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
  <tr><td style="background:#1e3a8a;padding:20px;color:#fff;text-align:center"><h2 style="margin:0;font-size:20px">Payment ${safeStatus}</h2></td></tr>
  <tr><td style="padding:22px"><p style="margin:0 0 12px;font-size:14px;color:#334155">Payment for order <strong>#${safeOrderId}</strong> has been updated to <strong>${safeStatus}</strong>.</p><p style="margin:0;font-size:13px;color:#64748b">Softpro Innovation</p></td></tr>
</table></div>`,
    });
};

const sendWelcomeEmail = async ({ email, name }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for registration");
    }

    const displayName = escapeHtml(String(name || "there").trim() || "there");
    const safeEmail = escapeHtml(email);
    const clientUrl = escapeHtml(process.env.CLIENT_URL || "http://localhost:5173");

    await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Welcome to Softpro Innovation - Your Account is Ready!",
        text: `Welcome, ${displayName}! Thank you for registering with Softpro Innovation. Your account (${email}) has been created successfully. Explore electronics, microcontrollers & robotics at ${clientUrl}/Product`,
        html: `<div style="margin:0;background:#f3f6fa;padding:28px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.04)">
  <tr>
    <td style="padding:28px 24px;background:linear-gradient(135deg,#0b1e3b 0%,#1e3a8a 60%,#ff6b35 120%);color:#ffffff;text-align:center">
      <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.3px">Softpro<span style="color:#ffb28a">Innovation</span></h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.92">Your Trusted Partner in Electronics & Robotics</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 24px">
      <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a">Welcome, ${displayName}! 🎉</h2>
      <p style="font-size:14px;line-height:1.65;color:#475569;margin:0 0 16px">
        Thank you for joining <strong>Softpro Innovation</strong>. Your account has been created successfully and is ready to use.
      </p>

      <div style="background:#f8fafc;border-left:4px solid #1e3a8a;border-radius:6px;padding:14px 16px;margin:18px 0 22px">
        <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">Registered Email</div>
        <div style="font-size:14px;color:#0f172a;font-weight:600;margin-top:2px">${safeEmail}</div>
      </div>

      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px">
        <h4 style="margin:0 0 10px;font-size:13px;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.5px">Why build with us?</h4>
        <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.7">
          <li>100% Genuine Microcontrollers, SBCs & Sensors (Raspberry Pi, Arduino, ESP32)</li>
          <li>Same-day dispatch guarantee on popular components</li>
          <li>Easy order tracking and verified invoice downloads</li>
          <li>Dedicated engineering & customer support</li>
        </ul>
      </div>

      <div style="text-align:center;margin:26px 0 16px">
        <a href="${clientUrl}/Product" style="display:inline-block;padding:12px 24px;background:#ff6b35;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;border-radius:8px;box-shadow:0 3px 8px rgba(255,107,53,0.3)">
          Explore Products Now
        </a>
      </div>

      <p style="margin:26px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;border-top:1px solid #f1f5f9;padding-top:20px">
        Need assistance? Email us at <a href="mailto:rsk205096@gmail.com" style="color:#1e3a8a;text-decoration:none">rsk205096@gmail.com</a> or call +91 8299403883.<br>
        &copy; 2026 Softpro Innovation. All rights reserved.
      </p>
    </td>
  </tr>
</table>
</div>`,
    });
};

const sendPasswordResetOtp = async ({ email, otp }) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("A valid customer email is required for password reset");
    }

    const safeOtp = escapeHtml(otp);
    const info = await getTransporter().sendMail({
        from: `Softpro Innovation <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Your Password Reset OTP: ${otp} | Softpro Innovation`,
        text: `Your Softpro Innovation password reset OTP is: ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone.`,
        html: `<div style="margin:0;background:#f3f6fa;padding:26px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.04)">
  <tr>
    <td style="padding:24px 20px;background:linear-gradient(135deg,#0b1e3b 0%,#1e3a8a 100%);color:#ffffff;text-align:center">
      <h2 style="margin:0;font-size:22px;font-weight:700">Softpro<span style="color:#ff6b35">Innovation</span></h2>
      <p style="margin:6px 0 0;font-size:12px;opacity:0.9">Account Security & Password Recovery</p>
    </td>
  </tr>
  <tr>
    <td style="padding:26px 22px;text-align:center">
      <h3 style="margin:0 0 10px;font-size:18px;color:#0f172a">Password Reset Verification</h3>
      <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.55">
        We received a request to reset your password. Use the 6-digit one-time password (OTP) below:
      </p>

      <div style="display:inline-block;margin:10px auto 20px;padding:14px 28px;background:#f8fafc;border:2px dashed #3b82f6;border-radius:10px">
        <span style="font-size:34px;letter-spacing:8px;font-weight:800;color:#1e3a8a;font-family:monospace">${safeOtp}</span>
      </div>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px;color:#9a3412;font-size:12.5px;text-align:left;line-height:1.5;margin-bottom:20px">
        <strong>⚠️ Security Notice:</strong> This OTP is valid for <strong>10 minutes</strong>. Do NOT share this code with anyone, including customer support. If you did not request this, please ignore this email.
      </div>

      <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;border-top:1px solid #f1f5f9;padding-top:16px">
        Softpro Innovation &middot; 3/213, Sec-J, Jankipuram, Lucknow - 226021<br>
        Support: rsk205096@gmail.com | +91 8299403883
      </p>
    </td>
  </tr>
</table>
</div>`,
    });

    return info.messageId;
};

module.exports = { createOtp, hashOtp, sendDeliveryOtp, sendOrderStatusEmail, sendOrderActivityEmail, sendPaymentStatusEmail, sendWelcomeEmail, sendPasswordResetOtp };