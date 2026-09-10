const express = require("express");

const cors = require("cors");

const dotenv = require("dotenv");

const app = express();

dotenv.config({ override: true });

const mongoDB = require("./config/db");
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use("/api/admin", require("./routes/adminRoutes"))
app.use("/api/user", require("./routes/userRoutes"))
app.use("/api/category", require("./routes/categoryRouter"))
app.use("/api/product", require("./routes/productRouter"))
app.use("/api/order", require("./routes/orderRoutes"))
app.use("/api/payment", require("./routes/paymentRoutes"))

mongoDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log("Server is Running");
        });
    })
    .catch((error) => {
        console.error("Database is not Connected", error.message);
        process.exit(1);
    });