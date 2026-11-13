const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must contain at least 2 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: { values: ['Electronics', 'Clothing', 'Food', 'Books', 'Furniture', 'Other'], message: 'Invalid category' }
  },
  price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: [0, 'Quantity cannot be negative'], validate: { validator: Number.isInteger, message: 'Quantity must be an integer' } },
  lowStockThreshold: { type: Number, min: 0, default: 5, validate: { validator: Number.isInteger, message: 'Low-stock threshold must be an integer' } },
  sku: { type: String, required: [true, 'SKU is required'], unique: true, trim: true, uppercase: true },
  supplier: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
