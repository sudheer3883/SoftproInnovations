const express = require("express");
const jwt = require("jsonwebtoken");

const Router = express.Router();
const Admin = require("../models/Admin");

Router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const data = await Admin.findOne({ email: email });

        if (!data) {
            return res.json({
                msg: "Email does not exist"
            });
        }

        if (data.password == password) {

            const token = jwt.sign(
                { id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            return res.json({
                msg: "Success",
                token: token,
                role: "admin",
                name: data.name,
                adminId: data._id,
                email:data.email
            });

        } else {
            return res.json({
                msg: "Password is Incorrect"
            });
        }

    } catch (er) {
        console.log(er);

        return res.json({
            msg: "Server Error"
        });
    }
});

Router.get("/show", async (req, res) => {
    res.json({
        msg: "Admin information get"
    });
});

Router.post("/register", async (req, res) => {
    try {

        const { name, email, password } = req.body;

        const a = await Admin.findOne({ email });

        if (a) {
            return res.json({
                msg: "Admin already exists"
            });
        }

        const data = new Admin({
            name: name,
            email: email,
            password: password
        });

        await data.save();

        return res.json({
            msg: "Admin Registered Successfully"
        });

    } catch (er) {

        console.log(er);

        return res.json({
            msg: "Server Error"
        });
    }
});

Router.patch("/updated/:id", async (req, res) => {
    try {
        const data = await Admin.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!data) {
            return res.json({
                msg: "Admin not found"
            });
        }
        return res.json({
            msg: "Admin Updated Successfully",
            data: data
        });
    } catch (er) {
        console.log(er);
        return res.json({
            msg: "Server Error"
        });
    }
});


Router.delete("/delete/:id", async (req, res) => {
    try {

        const data = await Admin.findByIdAndDelete(req.params.id);

        if (!data) {
            return res.json({
                msg: "Admin not found"
            });
        }

        return res.json({
            msg: "Admin Deleted Successfully"
        });

    } catch (er) {

        console.log(er);

        return res.json({
            msg: "Server Error"
        });
    }
});


module.exports = Router;