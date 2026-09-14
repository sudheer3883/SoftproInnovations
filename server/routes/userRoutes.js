const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Router = express.Router();

const User = require("../models/User")

Router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            return res.status(401).json({ msg: "Email does not exist" });
        }

        const passwordMatches = user.password?.startsWith("$2")
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        if (!passwordMatches) {
            return res.status(401).json({ msg: "Password is Incorrect" });
        }

        const token = jwt.sign(
            { id: user._id, role: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({
            msg: "Success",
            token,
            role: "user",
            userId: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            status: user.status,
            picture: user.picture,
            createdAt: user.createdAt
        });
    } catch (er) {
        console.log(er);
        return res.status(500).json({ msg: "Server Error" });
    }
});


Router.get("/show", async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });
        return res.json(users);
    } catch (er) {
        console.log(er);
        return res.status(500).json({ msg: "Failed to load users" });
    }
});

Router.post("/register", async (req, res) => {

    try {

        const { name, fullName, email, password, mobile, mobileNumber, status, gender, picture } = req.body;

        if (!name && !fullName || !email || !password) {
            return res.status(400).json({ msg: "Name, email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const a = await User.findOne({ email: normalizedEmail });

        if (a) {
            return res.json({ msg: "User already Exist" });
        }

        const data = new User({
            name: name || fullName,
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10),
            mobile: mobile || mobileNumber || 'Not provided',
            status: status || 'active',
            gender: gender || 'unspecified',
            picture: picture || ''

        });

        await data.save();

        return res.status(201).json({ msg: "User Registered" });

    } catch (er) {

        return res.json({ msg: "Server Error" });

    }

});

Router.patch("/change-password/:id", async (req, res) => {
    try {
        const authorization = req.headers.authorization || "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        const decoded = token ? jwt.verify(token, process.env.JWT_SECRET) : null;

        if (!decoded || String(decoded.id) !== String(req.params.id)) {
            return res.status(401).json({ msg: "Please sign in again" });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ msg: "Please provide a valid new password" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const passwordMatches = user.password?.startsWith("$2")
            ? await bcrypt.compare(currentPassword, user.password)
            : user.password === currentPassword;
        if (!passwordMatches) return res.status(400).json({ msg: "Current password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        return res.json({ msg: "Password changed successfully" });
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Please sign in again" });
        }
        console.log(error);
        return res.status(500).json({ msg: "Unable to change password" });
    }
});



Router.patch("/updated/:id", async (req, res) => {
    try {
        const { name, email, mobile, status } = req.body;
        if (!name || !email) {
            return res.status(400).json({ msg: "Name and email are required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name: name.trim(), email: email.trim().toLowerCase(), mobile: mobile || "Not provided", status: status || "active" },
            { new: true, runValidators: true },
        ).select("-password");

        if (!updatedUser) return res.status(404).json({ msg: "User not found" });
        return res.json({ msg: "User updated successfully", user: updatedUser });
    } catch (error) {
        return res.status(400).json({ msg: "Unable to update user" });
    }
});

Router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ msg: "User not found" });
        }
        return res.json({ msg: "User deleted successfully" });
    } catch (error) {
        return res.status(400).json({ msg: "Invalid user id" });
    }
});

module.exports = Router;