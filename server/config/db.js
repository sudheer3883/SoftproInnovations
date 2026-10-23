const mongoose = require("mongoose");
const dns = require("dns");

// Set IPv4 preference to avoid IPv6 timeouts when supported
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder("ipv4first");
    }
} catch (e) {}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Apply public DNS only for local development if needed, NEVER on serverless (Vercel)
const applyPublicDns = () => {
    if (isServerless) return;
    try {
        dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]);
    } catch (e) {}
};

// Automatic fallback: convert cluster0.xdexjca.mongodb.net SRV URI to direct replicaSet hosts
function getDirectUri(srvUri = "") {
    if (!srvUri) return null;
    const match = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@cluster0\.xdexjca\.mongodb\.net\/([^?]+)(\?.*)?$/);
    if (match) {
        const credentials = match[1];
        const dbName = match[2];
        return `mongodb://${credentials}@ac-mprekx0-shard-00-00.xdexjca.mongodb.net:27017,ac-mprekx0-shard-00-01.xdexjca.mongodb.net:27017,ac-mprekx0-shard-00-02.xdexjca.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-53cua1-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
    return null;
}

let cached = global.mongooseCache;
if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

// Connection options optimized for stability & serverless
const mongooseOptions = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
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

const VERIFIED_ATLAS_URI = "mongodb://sudheer:Sudheer12345@ac-mprekx0-shard-00-00.xdexjca.mongodb.net:27017,ac-mprekx0-shard-00-01.xdexjca.mongodb.net:27017,ac-mprekx0-shard-00-02.xdexjca.mongodb.net:27017/softproinnovation?ssl=true&replicaSet=atlas-53cua1-shard-0&authSource=admin&retryWrites=true&w=majority";

async function mongoDB() {
    // If already connected, return existing connection
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI && !VERIFIED_ATLAS_URI) {
        console.warn("MONGO_URI environment variable is not defined!");
        return null;
    }

    // If connection attempt is in flight, await it
    if (cached.promise) {
        return cached.promise;
    }

    cached.promise = (async () => {
        const primaryUri = process.env.MONGO_URI || VERIFIED_ATLAS_URI;
        const directFallback = getDirectUri(primaryUri);

        try {
            const db = await mongoose.connect(primaryUri, mongooseOptions);
            cached.conn = db;
            return db;
        } catch (error) {
            const errMsg = String(error.message || "");
            const isDnsOrSrvError = errMsg.includes("querySrv") ||
                errMsg.includes("ECONNREFUSED") ||
                errMsg.includes("ETIMEOUT") ||
                errMsg.includes("ENOTFOUND");
            const isAuthError = errMsg.includes("authentication failed") || errMsg.includes("bad auth");

            // Attempt 1: Direct replicaSet URI fallback if available
            if (directFallback && primaryUri !== directFallback) {
                console.warn("Retrying MongoDB connection with direct replicaSet URI fallback...");
                try {
                    const db = await mongoose.connect(directFallback, mongooseOptions);
                    cached.conn = db;
                    return db;
                } catch (fallbackError) {
                    console.error("Direct fallback failed:", fallbackError.message);
                }
            }

            // Attempt 2: If authentication failed or bad auth, try verified cluster credentials
            if (isAuthError && primaryUri !== VERIFIED_ATLAS_URI) {
                console.warn("Retrying MongoDB connection with verified cluster credentials fallback...");
                try {
                    const db = await mongoose.connect(VERIFIED_ATLAS_URI, mongooseOptions);
                    cached.conn = db;
                    return db;
                } catch (verifiedError) {
                    console.error("Verified cluster fallback failed:", verifiedError.message);
                }
            }

            // Attempt 3: On local development only, apply public DNS and retry
            if (!isServerless && isDnsOrSrvError) {
                console.warn("Retrying MongoDB connection with local public DNS fallback...");
                applyPublicDns();
                const db = await mongoose.connect(primaryUri, mongooseOptions);
                cached.conn = db;
                return db;
            }

            // Attempt 4: Ultimate fallback to verified cluster URI if not already tried
            if (primaryUri !== VERIFIED_ATLAS_URI) {
                console.warn("Attempting ultimate fallback to verified cluster URI...");
                try {
                    const db = await mongoose.connect(VERIFIED_ATLAS_URI, mongooseOptions);
                    cached.conn = db;
                    return db;
                } catch (ultimateError) {
                    console.error("Ultimate fallback failed:", ultimateError.message);
                }
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
            console.error("Database connection failed:", error.message);
            throw error;
        });

    return cached.promise;
}

module.exports = mongoDB;