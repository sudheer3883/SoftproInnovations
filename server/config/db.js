const mongoose = require("mongoose");
const dns = require("dns");

try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

let isConnected = false;

async function mongoDB() {
    if (isConnected || mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
        console.warn("MONGO_URI environment variable is not defined!");
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        isConnected = db.connections[0].readyState === 1;
        console.log("Database is Connected");
        return db;
    } catch (error) {
        console.error("Database is not Connected", error.message);
        throw error;
    }
}

module.exports = mongoDB;