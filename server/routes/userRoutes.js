const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Router = express.Router();

const User = require("../models/User")
const requireAdmin = require("../middleware/requireAdmin");
const { createOtp, hashOtp, sendWelcomeEmail, sendPasswordResetOtp } = require("../services/deliveryOtp");

const normalizeEmail = (value = "") => String(value).trim().replace(/\s+/g, "").toLowerCase();
const findUserByEmail = async (value) => {
    const normalizedEmail = normalizeEmail(value);
    if (!normalizedEmail) return null;
    // 1. Direct indexed match first for instant query speed
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        // 2. Case-insensitive fallback
        user = await User.findOne({
            email: {
                $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
            },
        });
    }
    return user;
};

Router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: "Email and password are required" });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(401).json({ msg: "Email does not exist" });
        }

        const passwordMatches = user.password?.startsWith("$2")
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        if (!passwordMatches) {
            return res.status(401).json({ msg: "Password is Incorrect" });
        }

        // Migrate plain-text password to bcrypt hash seamlessly
        if (!user.password?.startsWith("$2")) {
            try {
                user.password = await bcrypt.hash(password, 10);
                await user.save();
            } catch (hashErr) {
                console.warn("Notice: could not auto-migrate password hash:", hashErr.message);
            }
        }

        const token = jwt.sign(
            { id: user._id, role: "user" },
            process.env.JWT_SECRET || "fallback_jwt_secret_softpro",
            { expiresIn: "7d" }
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
        console.error("Login route error:", er);
        return res.status(500).json({ msg: "Server Error. Please try again." });
    }
});


Router.get("/show", requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });
        return res.json(users);
    } catch (er) {
        console.error("Load users error:", er);
        return res.status(500).json({ msg: "Failed to load users" });
    }
});

Router.post("/register", async (req, res) => {
    try {
        const { name, fullName, email, password, mobile, mobileNumber, status, gender, picture } = req.body;
        const displayName = String(name || fullName || "").trim();

        if (!displayName || !email || !password) {
            return res.status(400).json({ msg: "Name, email and password are required" });
        }

        if (String(password).length < 4) {
            return res.status(400).json({ msg: "Password must be at least 4 characters" });
        }

        const normalizedEmail = normalizeEmail(email);
        const existing = await findUserByEmail(normalizedEmail);

        if (existing) {
            return res.status(400).json({ msg: "An account already exists with this email address." });
        }

        // Cap avatar image string to 1.5MB to protect database performance
        let userPicture = picture || "";
        if (typeof userPicture === "string" && userPicture.length > 2 * 1024 * 1024) {
            userPicture = "";
        }

        const data = new User({
            name: displayName,
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10),
            mobile: mobile || mobileNumber || "Not provided",
            status: status || "active",
            gender: gender || "unspecified",
            picture: userPicture
        });

        await data.save();

        let welcomeEmailSent = false;
        try {
            await sendWelcomeEmail({
                email: normalizedEmail,
                name: data.name,
            });
            welcomeEmailSent = true;
            console.log(`Welcome email successfully sent to ${normalizedEmail}`);
        } catch (emailError) {
            console.error("Welcome email notice:", emailError.message);
            welcomeEmailSent = false;
        }

        return res.status(201).json({
            msg: "User Registered",
            welcomeEmailSent,
            user: {
                id: data._id,
                name: data.name,
                email: data.email,
            }
        });

    } catch (er) {
        console.error("Registration error:", er);
        return res.status(500).json({ msg: "Server Error. Please try again." });
    }
});

Router.post("/forgot-password/request", async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ msg: "Please enter your registered email address" });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ msg: "This email address is not registered. Please enter the email added to your account." });
        }

        const otp = createOtp();
        const deliveryEmail = String(user.email).trim().toLowerCase();

        user.resetOtpHash = hashOtp(otp);
        user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.resetOtpAttempts = 0;
        await user.save();

        let messageId;
        try {
            messageId = await sendPasswordResetOtp({ email: deliveryEmail, otp });
        } catch (emailError) {
            user.resetOtpHash = undefined;
            user.resetOtpExpires = undefined;
            user.resetOtpAttempts = 0;
            await user.save();
            throw emailError;
        }

        console.log(`Password reset OTP sent to ${email} (${messageId})`);
        return res.json({
            msg: "A 6-digit OTP has been sent to your registered Gmail address.",
            email: deliveryEmail,
        });
    } catch (error) {
        console.error("Password reset OTP failed:", error.message);
        return res.status(503).json({ msg: "Unable to send OTP email right now. Please try again in a moment." });
    }
});

Router.post("/forgot-password/reset", async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.newPassword || "");
        if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(otp) || newPassword.length < 6) {
            return res.status(400).json({ msg: "Enter a valid email, 6-digit OTP and password of at least 6 characters" });
        }

        const user = await findUserByEmail(email);
        if (!user || !user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires.getTime() < Date.now()) {
            return res.status(400).json({ msg: "OTP is invalid or expired" });
        }
        if (Number(user.resetOtpAttempts || 0) >= 5) {
            return res.status(429).json({ msg: "Too many incorrect attempts. Request a new OTP." });
        }
        if (hashOtp(otp) !== user.resetOtpHash) {
            user.resetOtpAttempts = Number(user.resetOtpAttempts || 0) + 1;
            await user.save();
            return res.status(400).json({ msg: "OTP is invalid or expired" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOtpHash = undefined;
        user.resetOtpExpires = undefined;
        user.resetOtpAttempts = 0;
        await user.save();
        return res.json({ msg: "Password reset successfully. You can sign in now." });
    } catch (error) {
        console.error("Password reset failed:", error.message);
        return res.status(500).json({ msg: "Unable to reset password" });
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



Router.patch("/updated/:id", requireAdmin, async (req, res) => {
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

Router.delete("/delete/:id", requireAdmin, async (req, res) => {
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