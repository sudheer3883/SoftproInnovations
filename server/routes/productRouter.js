const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const Category = require('../models/Category');

const Router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) return callback(null, true);
        return callback(new Error('Only image files are allowed'));
    }
});

const parseJson = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return fallback; }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureCategoryProducts = async () => {
    const categories = await Category.find({ status: { $nin: ['inactive', 'delete'] } }).lean();
    const usedPrices = new Set(
        (await Product.find({}, { price: 1 }).lean())
            .map((product) => Number(product.price))
            .filter((price) => Number.isFinite(price)),
    );

    for (const category of categories) {
        const categoryPattern = new RegExp(`^${escapeRegex(category.name)}$`, 'i');
        const existingProduct = await Product.exists({ category: categoryPattern });

        if (!existingProduct) {
            let starterPrice = 1000;
            while (usedPrices.has(starterPrice)) starterPrice += 1;

            await Product.create({
                name: `${category.name} Starter Product`,
                category: category.name,
                brand: 'Softpro Innovation',
                description: `A reliable ${category.name.toLowerCase()} component for electronics and embedded projects.`,
                image: category.image || '',
                price: starterPrice,
                originalPrice: starterPrice + 100,
                stock: 25,
                status: 'active',
                featured: true
            });
            usedPrices.add(starterPrice);
        }
    }
};

const ensureUniqueProductPrices = async () => {
    const products = await Product.find({}, { price: 1 }).sort({ createdAt: 1 }).lean();
    const usedPrices = new Set();
    const updates = [];
    let nextPrice = Math.max(1000, ...products.map((product) => Number(product.price) || 0)) + 1;

    for (const product of products) {
        const price = Number(product.price);
        if (!Number.isFinite(price) || usedPrices.has(price)) {
            while (usedPrices.has(nextPrice)) nextPrice += 1;
            updates.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: { $set: { price: nextPrice, originalPrice: nextPrice + 100 } },
                },
            });
            usedPrices.add(nextPrice);
            nextPrice += 1;
        } else {
            usedPrices.add(price);
        }
    }

    if (updates.length > 0) await Product.bulkWrite(updates);
};

const getProductData = (body, file, existing = {}) => {
    const data = {
        name: body.name || body.title,
        category: body.category,
        brand: body.brand,
        description: body.description,
        galleryImages: parseJson(body.galleryImages, existing.galleryImages || []),
        dimensions: parseJson(body.dimensions, existing.dimensions),
        weight: body.weight,
        shippingClass: body.shippingClass,
        price: body.price,
        originalPrice: body.originalPrice,
        stock: body.stock,
        status: body.status,
        featured: body.featured
    };
    const image = file
        ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        : body.image;
    if (image !== undefined && image !== '') data.image = image;
    return data;
};

Router.get('/show', async (req, res) => {
    try {
        await ensureCategoryProducts();
        await ensureUniqueProductPrices();
        const data = (await Product.find({}).sort({ createdAt: -1 })).map((product) => {
            const item = product.toObject();
            if (item.brand === 'SIPL') item.brand = '';
            return item;
        });
        return res.json(data);
    } catch (er) {
        return res.status(500).json({ message: 'Failed to load products' });
    }
});

Router.get('/:id/image', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select('image').lean();
        const image = product?.image || '';
        const match = image.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
        if (!match) return res.status(404).end();

        const [, contentType, encoding, payload] = match;
        const buffer = encoding
            ? Buffer.from(payload, 'base64')
            : Buffer.from(decodeURIComponent(payload));
        res.set('Cache-Control', 'public, max-age=86400');
        return res.type(contentType).send(buffer);
    } catch (error) {
        return res.status(400).end();
    }
});

Router.get('/:id', async (req, res) => {
    try {
        const data = await Product.findById(req.params.id);
        if (!data) return res.status(404).json({ message: 'Product not found' });
        const item = data.toObject();
        if (item.brand === 'SIPL') item.brand = '';
        return res.json(item);
    } catch (er) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
});

Router.post('/register', upload.single('image'), async (req, res) => {
    try {
        const data = await Product.create(getProductData(req.body, req.file));
        return res.status(201).json({ message: 'Product registered successfully', data });
    } catch (er) {
        return res.status(400).json({ message: er.message || 'Failed to register product' });
    }
});

Router.put('/update/:id', upload.single('image'), async (req, res) => {
    try {
        const existing = await Product.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Product not found' });
        const data = await Product.findByIdAndUpdate(
            req.params.id,
            getProductData(req.body, req.file, existing),
            { new: true, runValidators: true }
        );
        return res.json({ message: 'Product updated successfully', data });
    } catch (er) {
        return res.status(400).json({ message: er.message || 'Failed to update product' });
    }
});

Router.delete('/delete/:id', async (req, res) => {
    try {
        const data = await Product.findByIdAndDelete(req.params.id);
        if (!data) return res.status(404).json({ message: 'Product not found' });
        return res.json({ message: 'Product deleted successfully' });
    } catch (er) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
});

Router.use((er, req, res, next) => {
    if (er instanceof multer.MulterError || er.message === 'Only image files are allowed') {
        return res.status(400).json({ message: er.message });
    }
    return next(er);
});

module.exports = Router;