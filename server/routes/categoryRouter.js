const express = require("express");

const Router = express.Router();

const Category = require("../models/Category");
const requireAdmin = require("../middleware/requireAdmin");


Router.get("/show", async (req, res) => {
    try {
        const data = await Category.find({}).sort({ createdAt: -1 });
        res.json(data);
    } catch (er) {
        res.status(500).json({ message: "Failed to load categories" });
    }
});


Router.post("/register", requireAdmin, async (req, res) => {

    try {

        const { category, image, description, status } = req.body;
        const name = String(category || '').trim();

        if (!name || !String(image || '').trim() || !String(description || '').trim()) {
            return res.status(400).json({ message: "Category name, image and description are required" });
        }

        const a = await Category.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });

        if (a) {
            return res.status(409).json({ message: "Category already exists" });
        }

        const data = new Category({
            name,
            image: String(image).trim(),
            description: String(description).trim(),
            status: status || 'active'
        });

        await data.save();

        return res.status(201).json({ message: "Category Registered" });

    } catch (er) {

        return res.status(500).json({ message: "Server Error" });

    }

});


Router.put("/update/:id", requireAdmin, async (req, res) => {
    try {
        const { category, image, description, status } = req.body;
        const data = await Category.findByIdAndUpdate(
            req.params.id,
            { name: category, image, description, status },
            { new: true, runValidators: true }
        );
        if (!data) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category updated successfully", data });
    } catch (er) {
        res.status(500).json({ message: "Failed to update category" });
    }
});


Router.delete("/delete/:id", requireAdmin, async (req, res) => {
    try {
        const data = await Category.findByIdAndDelete(req.params.id);
        if (!data) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category deleted successfully" });
    } catch (er) {
        res.status(500).json({ message: "Failed to delete category" });
    }
});


module.exports = Router;