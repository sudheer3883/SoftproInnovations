const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load .env explicitly from server directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

const mongoDB = require("./config/db");

const app = express();

// ================= Middleware =================

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Ensure DB is connected for serverless & regular requests
app.use(async (req, res, next) => {
    // Skip static/health routes
    if (req.path === "/" || req.path === "/api/health") {
        return next();
    }

    try {
        await mongoDB();
        next();
    } catch (err) {
        console.error("MongoDB connection middleware error:", err.message);
        return res.status(503).json({
            msg: "Database connection is currently unavailable. Please try again shortly.",
            error: err.message
        });
    }
});

// ================= Routes =================

app.get("/", (req, res) => {
    res.send("SoftproInnovations Backend API is Running");
});

app.get("/api/health", async (req, res) => {
    const mongoose = require("mongoose");
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    let dbState = states[mongoose.connection.readyState] || "unknown";

    // Try connecting if disconnected
    if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
        try {
            await mongoDB();
            dbState = states[mongoose.connection.readyState] || "connected";
        } catch (e) {
            dbState = "connection_failed";
        }
    }

    res.json({
        server: "running",
        database: dbState,
        hasMongoUri: Boolean(process.env.MONGO_URI),
        isLocalMongo: process.env.MONGO_URI
            ? process.env.MONGO_URI.includes("localhost") || process.env.MONGO_URI.includes("127.0.0.1")
            : false,
        hasJwtSecret: Boolean(process.env.JWT_SECRET)
    });
});

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/category", require("./routes/categoryRouter"));
app.use("/api/product", require("./routes/productRouter"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// ================= Server Startup =================

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Initiate DB connection asynchronously
mongoDB().catch((error) => {
    console.error("Initial database connection error:", error.message);
});

module.exports = app;