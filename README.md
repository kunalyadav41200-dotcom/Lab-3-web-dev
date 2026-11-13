# Assignment 3: Inventory and Data Management System

A RESTful inventory backend built with Node.js, Express.js, MongoDB, Mongoose and dotenv, following the supplied Web Dev III Assignment 3 requirements.

## Features
- Mongoose Product schema with required fields, type checks, ranges, enum validation and unique SKU.
- Create, read, update and delete product APIs.
- Search and filter by category, name/description/SKU and price range.
- Sorting and pagination using query parameters.
- Safe stock restock and sale operations (sales cannot reduce stock below zero).
- Low-stock report based on each product's `lowStockThreshold`.
- Category-wise aggregation: product count, quantity, inventory value and average price.
- Centralized error handling and environment-variable configuration.

## Setup
1. Install Node.js and start MongoDB locally, or create a MongoDB Atlas database.
2. Open this project folder in VS Code / terminal.
3. Install packages:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and set your MongoDB connection string:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. Visit `http://localhost:5000` to confirm that the API is running.

## Product schema
| Field | Type | Validation |
|---|---|---|
| name | String | Required, 2–100 characters |
| description | String | Optional, maximum 500 characters |
| category | String | Required; Electronics, Clothing, Food, Books, Furniture or Other |
| price | Number | Required, minimum 0 |
| quantity | Number | Required, non-negative integer |
| lowStockThreshold | Number | Non-negative integer, default 5 |
| sku | String | Required, unique, uppercase |
| supplier | String | Optional |

## API endpoints
Base URL: `http://localhost:5000/api/products`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Create product |
| GET | `/` | List products with filtering, sorting and pagination |
| GET | `/:id` | Get one product |
| PUT | `/:id` | Update product details |
| PATCH | `/:id/stock` | Restock or record a sale |
| DELETE | `/:id` | Delete product |
| GET | `/reports/low-stock` | List products at/below their low-stock threshold |
| GET | `/reports/category-summary` | Category-wise inventory aggregation |

## Example requests

### Create product — POST `/api/products`
```json
{
  "name": "Wireless Mouse",
  "description": "USB wireless optical mouse",
  "category": "Electronics",
  "price": 599,
  "quantity": 25,
  "lowStockThreshold": 5,
  "sku": "WM-001",
  "supplier": "ABC Traders"
}
```

### Filter, search, sort and paginate — GET
`/api/products?category=Electronics&search=mouse&minPrice=100&maxPrice=1000&sortBy=price&order=asc&page=1&limit=10`

Allowed `sortBy`: `name`, `price`, `quantity`, `createdAt`. `order`: `asc` or `desc`.

### Restock — PATCH `/api/products/PRODUCT_ID/stock`
```json
{ "operation": "restock", "quantity": 10 }
```

### Record sale — PATCH `/api/products/PRODUCT_ID/stock`
```json
{ "operation": "sale", "quantity": 2 }
```

### Update product — PUT `/api/products/PRODUCT_ID`
```json
{ "price": 649, "quantity": 30 }
```

## Testing
Use Postman, Thunder Client, or curl. First create a product and copy its `_id` from the response to test single-product, update, stock and delete routes. Test report routes after adding products in at least two categories and one product whose quantity is at or below its threshold.

## Project structure
```text
inventory_assignment/
├── middleware/
│   └── errorHandler.js
├── models/
│   └── Product.js
├── routes/
│   └── productRoutes.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```
