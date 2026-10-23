🚀 **My MERN Stack Major Project – SoftPro Innovations | Full-Stack E-Commerce Website**

I’m excited to share my **Major Full-Stack E-Commerce Project – SoftPro Innovations**, developed as a part of my **MERN Stack journey**. 💻🔥

🛠️ **Tech Stack:**
• MongoDB – Database
• Express.js – Backend Framework
• React.js + Vite – Frontend
• Node.js – Backend Runtime
• Nodemailer – Gmail SMTP Delivery System
• Razorpay & PayU – Payment Gateway Integrations
• JavaScript – Programming Language

💡 **Key Features & Enhancements:**
• Full-Stack MERN Architecture with RESTful APIs
• User Authentication (Login, Register with profile image compression & auto bcrypt hashing)
• Automated Gmail Notifications (Welcome email on register, Password Reset 6-Digit OTP, Order status updates)
• Bulletproof Database Connection with zero-latency direct ReplicaSet connection & automated SRV fallback
• Mobile-responsive UI with quick-action cart and fluid navigation
• Optimized product catalogs with cached initial seed queries and edge CORS support
• Production-ready Vercel serverless backend and frontend deployment

🔗 **Live URLs:**
• Frontend (Vercel): https://softpro-innovations-dri6.vercel.app/
• Backend API (Vercel): https://softpro-innovations-i2rs-wheat.vercel.app/

---

## ⚙️ Vercel Deployment Guide

To deploy this project seamlessly on Vercel without connection or authentication errors:

### 1. Backend Project Deployment (`server`)
1. Create a new project on Vercel and select this repository.
2. Set **Root Directory** to `server`.
3. In **Settings -> Environment Variables**, add the following:

| Variable Name | Recommended Value |
|---|---|
| `MONGO_URI` | `mongodb://sudheer:Sudheer12345@ac-mprekx0-shard-00-00.xdexjca.mongodb.net:27017,ac-mprekx0-shard-00-01.xdexjca.mongodb.net:27017,ac-mprekx0-shard-00-02.xdexjca.mongodb.net:27017/softproinnovation?ssl=true&replicaSet=atlas-53cua1-shard-0&authSource=admin&retryWrites=true&w=majority` |
| `JWT_SECRET` | `p6sdUBPi5cCplivmoyiys9Kdat85AR5TMhwFS5bbJwV` |
| `PORT` | `5000` |
| `CLIENT_URL` | `https://softpro-innovations-dri6.vercel.app` |
| `FRONTEND_URL` | `https://softpro-innovations-dri6.vercel.app` |
| `SERVER_URL` | `https://softpro-innovations-i2rs-wheat.vercel.app` |
| `SMTP_USER` | `rsk205096@gmail.com` |
| `SMTP_PASS` | `uxnpjsxlewmkjhtq` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `RAZORPAY_KEY_ID` | `rzp_test_TbvjrmPKiwi46E` |
| `RAZORPAY_KEY_SECRET` | `E0RgS4wQP0A4H5UPUISFlHh1` |

> **Note:** The direct ReplicaSet URI above bypasses DNS SRV queries, preventing connection drops on Vercel serverless and local Indian ISPs.

### 2. Frontend Project Deployment (`client`)
1. Create another project on Vercel (or configure the client project) with **Root Directory** set to `client`.
2. In **Settings -> Environment Variables**, add:
   - `VITE_API_URL` = `https://softpro-innovations-i2rs-wheat.vercel.app`
3. Deploy / Redeploy the project.

---

## 💻 Local Development Setup

### Backend:
```bash
cd server
npm install
npm run dev
```

### Frontend:
```bash
cd client
npm install
npm run dev
```

---

📌 **Project:** SoftPro Innovations  
🛒 **Type:** Full-Stack E-Commerce Website  
⚡ **Stack:** MERN  
🎯 **Focus:** Full-Stack Web Development  

