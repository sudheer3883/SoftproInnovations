const mongoose = require("mongoose");
const dns = require("dns");

// Set IPv4 preference to avoid IPv6 timeouts
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder("ipv4first");
    }
} catch (e) {}

// Apply reliable public DNS fallback for MongoDB Atlas SRV lookups
const applyPublicDns = () => {
    try {
        dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]);
    } catch (e) {}
};

// Apply custom DNS on non-serverless or local environments
applyPublicDns();

let cached = global.mongooseCache;
if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

// Connection options optimized for stability & serverless
const mongooseOptions = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
};

// Monitor connection events once
if (!global.mongooseListenersAttached) {
    global.mongooseListenersAttached = true;
    mongoose.connection.on("connected", () => {
        console.log("MongoDB connected successfully");
    });
    mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection runtime error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB connection disconnected");
        if (cached) {
            cached.conn = null;
            cached.promise = null;
        }
    });
}

async function mongoDB() {
    // If already connected, return existing connection
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
        console.warn("MONGO_URI environment variable is not defined!");
        return null;
    }

    // If connection attempt is in flight, await it
    if (cached.promise) {
        return cached.promise;
    }

    cached.promise = (async () => {
        try {
            const db = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
            cached.conn = db;
            return db;
        } catch (error) {
            // If DNS SRV query failed, force public DNS and retry once
            const errMsg = String(error.message || "");
            if (errMsg.includes("querySrv") || errMsg.includes("ECONNREFUSED") || errMsg.includes("ETIMEOUT")) {
                console.warn("Retrying MongoDB connection with public DNS fallback...");
                applyPublicDns();
                const db = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
                cached.conn = db;
                return db;
            }
            throw error;
        }
    })()
        .then((db) => {
            return db;
        })
        .catch((error) => {
            cached.promise = null;
            cached.conn = null;
            console.error("Database is not Connected:", error.message);
            throw error;
        });

    return cached.promise;
}

module.exports = mongoDB;