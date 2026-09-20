const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const mongoDB = require("./config/db");

const app = express();


// ================= Middleware =================

app.use(cors());

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true }));

// Ensure DB is connected for serverless environments (Vercel)
app.use(async (req, res, next) => {
    try {
        await mongoDB();
    } catch (err) {
        // Log error but let route handle or return appropriate message
        console.error("MongoDB connection middleware error:", err.message);
    }
    next();
});


// ================= Routes =================

app.get("/", (req, res) => {
    res.send("SoftproInnovations Backend API is Running");
});

app.get("/api/health", (req, res) => {
    const mongoose = require("mongoose");
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    res.json({
        server: "running",
        database: states[mongoose.connection.readyState] || "unknown",
        hasMongoUri: Boolean(process.env.MONGO_URI),
        isLocalMongo: process.env.MONGO_URI ? process.env.MONGO_URI.includes("localhost") || process.env.MONGO_URI.includes("127.0.0.1") : false,
        hasJwtSecret: Boolean(process.env.JWT_SECRET)
    });
});

app.use("/api/admin", require("./routes/adminRoutes"));

app.use("/api/user", require("./routes/userRoutes"));

app.use("/api/category", require("./routes/categoryRouter"));

app.use("/api/product", require("./routes/productRouter"));

app.use("/api/order", require("./routes/orderRoutes"));

app.use("/api/payment", require("./routes/paymentRoutes"));


// ================= Database =================

mongoDB()
    .then(() => {
        if (!process.env.VERCEL) {
            app.listen(process.env.PORT || 5000, () => {
                console.log(`Server is running on port ${process.env.PORT || 5000}`);
            });
        }
    })
    .catch((error) => {
        console.error("Database is not connected:", error.message);
    });

module.exports = app;