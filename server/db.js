const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'app.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    price TEXT,
    qty INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    subcategory TEXT,
    category_key TEXT NOT NULL DEFAULT '',
    subcategory_key TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    origin TEXT,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    sale_price INTEGER,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    sold_count INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 5,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Bảng products được tạo lần đầu không có 2 cột dưới đây; thêm bằng ALTER TABLE
// cho các DB đã tồn tại từ trước (CREATE TABLE IF NOT EXISTS không tự thêm cột mới).
const existingProductColumns = db.prepare("PRAGMA table_info(products)").all().map((col) => col.name);
if (!existingProductColumns.includes('category_key')) {
  db.exec("ALTER TABLE products ADD COLUMN category_key TEXT NOT NULL DEFAULT ''");
}
if (!existingProductColumns.includes('subcategory_key')) {
  db.exec('ALTER TABLE products ADD COLUMN subcategory_key TEXT');
}

module.exports = db;
