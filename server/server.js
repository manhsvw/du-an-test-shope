const path = require('node:path');
const os = require('node:os');
const express = require('express');
const session = require('express-session');
const db = require('./db');
const { hashPassword, verifyPassword, requireAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: 'shoppe-local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

// ----- Auth -----
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email và mật khẩu (tối thiểu 6 ký tự) là bắt buộc' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email này đã được đăng ký' });
  }

  const passwordHash = hashPassword(password);
  const displayName = name || email.split('@')[0];
  const result = db
    .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
    .run(email, displayName, passwordHash);

  const user = { id: Number(result.lastInsertRowid), email, name: displayName };
  req.session.userId = user.id;
  res.status(201).json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');

  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
  }

  req.session.userId = user.id;
  res.json({ user: toPublicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.json({ user: null });

  res.json({ user: toPublicUser(user) });
});

// ----- Cart -----
app.get('/api/cart', requireAuth, (req, res) => {
  const items = db
    .prepare('SELECT product_id AS productId, name, image, price, qty FROM cart_items WHERE user_id = ?')
    .all(req.session.userId);
  res.json({ items });
});

app.post('/api/cart', requireAuth, (req, res) => {
  const { productId, name, image, price } = req.body || {};
  if (!productId || !name) {
    return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
  }

  db.prepare(
    `INSERT INTO cart_items (user_id, product_id, name, image, price, qty)
     VALUES (?, ?, ?, ?, ?, 1)
     ON CONFLICT(user_id, product_id) DO UPDATE SET qty = qty + 1`
  ).run(req.session.userId, productId, name, image || '', price || '');

  const items = db
    .prepare('SELECT product_id AS productId, name, image, price, qty FROM cart_items WHERE user_id = ?')
    .all(req.session.userId);
  res.status(201).json({ items });
});

app.delete('/api/cart/:productId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(
    req.session.userId,
    req.params.productId
  );

  const items = db
    .prepare('SELECT product_id AS productId, name, image, price, qty FROM cart_items WHERE user_id = ?')
    .all(req.session.userId);
  res.json({ items });
});

// ----- Static site -----
app.use(express.static(path.join(__dirname, '..')));

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((info) => info.family === 'IPv4' && !info.internal)
    .map((info) => info.address);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shoppe server dang chay tai http://localhost:${PORT}`);
  lanAddresses().forEach((ip) => {
    console.log(`  -> Truy cap tu thiet bi khac trong mang: http://${ip}:${PORT}`);
  });
});
