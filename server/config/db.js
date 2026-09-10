const mongoose = require("mongoose");

function mongoDB() {
    return mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
    }).then(() => {
        console.log("Database is Connected");
    });
}

module.exports = mongoDB;