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


// ================= Routes =================

app.use("/api/admin", require("./routes/adminRoutes"));

app.use("/api/user", require("./routes/userRoutes"));

app.use("/api/category", require("./routes/categoryRouter"));

app.use("/api/product", require("./routes/productRouter"));

app.use("/api/order", require("./routes/orderRoutes"));

app.use("/api/payment", require("./routes/paymentRoutes"));


// ================= Database =================

mongoDB()
    .then(() => {

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });

    })
    .catch((error) => {

        console.error(
            "Database is not connected:",
            error.message
        );

        process.exit(1);

    });