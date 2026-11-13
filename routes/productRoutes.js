const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID' });
  next();
};

// CREATE: POST /api/products
router.post('/', asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, message: 'Product created successfully', data: product });
}));

// READ ALL: GET /api/products?category=Electronics&search=phone&sortBy=price&order=asc&page=1&limit=10
router.get('/', asyncHandler(async (req, res) => {
  const { category, search, minPrice, maxPrice, sortBy = 'createdAt', order = 'desc' } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const filter = {};

  if (category) filter.category = category;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { sku: { $regex: search, $options: 'i' } }
  ];
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    if (Object.values(filter.price).some(value => !Number.isFinite(value))) {
      return res.status(400).json({ success: false, message: 'minPrice and maxPrice must be valid numbers' });
    }
  }

  const allowedSortFields = ['name', 'price', 'quantity', 'createdAt'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ [safeSortBy]: sortOrder }).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter)
  ]);

  res.json({ success: true, count: products.length, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, data: products });
}));

// LOW STOCK REPORT: GET /api/products/reports/low-stock
router.get('/reports/low-stock', asyncHandler(async (req, res) => {
  const products = await Product.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }).sort({ quantity: 1 });
  res.json({ success: true, count: products.length, data: products });
}));

// CATEGORY SUMMARY: GET /api/products/reports/category-summary
router.get('/reports/category-summary', asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    { $group: { _id: '$category', totalProducts: { $sum: 1 }, totalQuantity: { $sum: '$quantity' }, totalInventoryValue: { $sum: { $multiply: ['$price', '$quantity'] } }, averagePrice: { $avg: '$price' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, category: '$_id', totalProducts: 1, totalQuantity: 1, totalInventoryValue: { $round: ['$totalInventoryValue', 2] }, averagePrice: { $round: ['$averagePrice', 2] } } }
  ]);
  res.json({ success: true, data: summary });
}));

// READ ONE: GET /api/products/:id
router.get('/:id', validId, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
}));

// UPDATE DETAILS: PUT /api/products/:id
router.put('/:id', validId, asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;
  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product updated successfully', data: product });
}));

// STOCK ADJUSTMENT: PATCH /api/products/:id/stock  {"operation":"restock","quantity":10}
router.patch('/:id/stock', validId, asyncHandler(async (req, res) => {
  const { operation, quantity } = req.body;
  if (!['restock', 'sale'].includes(operation) || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Provide operation as restock or sale and a positive integer quantity' });
  }
  const change = operation === 'restock' ? quantity : -quantity;
  const condition = operation === 'sale' ? { _id: req.params.id, quantity: { $gte: quantity } } : { _id: req.params.id };
  const product = await Product.findOneAndUpdate(condition, { $inc: { quantity: change } }, { new: true, runValidators: true });
  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    return res.status(exists ? 400 : 404).json({ success: false, message: exists ? 'Insufficient stock for this sale' : 'Product not found' });
  }
  res.json({ success: true, message: `Stock ${operation === 'restock' ? 'increased' : 'decreased'} successfully`, data: product });
}));

// DELETE: DELETE /api/products/:id
router.delete('/:id', validId, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted successfully', data: product });
}));

module.exports = router;
