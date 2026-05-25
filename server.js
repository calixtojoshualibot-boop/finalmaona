import express from "express";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database pool configuration for Aiven/MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 3306,
  ssl: {
    rejectUnauthorized: false 
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- AUTH API ---
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT id, email, role, name, phone, address FROM users WHERE email = ? AND password = ?", [email, password]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const id = Date.now().toString();
  try {
    await pool.query("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, 'user')", [id, name, email, password]);
    res.json({ id, name, email, role: 'user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CAPS API ---
app.get("/api/caps", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM caps");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/caps", async (req, res) => {
  const { name, team, year, condition, price, description, image, featured } = req.body;
  const id = Date.now().toString();
  try {
    await pool.query(
      "INSERT INTO caps (id, name, team, year, `condition`, price, description, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, team, year, condition, price, description, image, featured ? 1 : 0]
    );
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/caps/:id", async (req, res) => {
  const { name, team, year, condition, price, description, image, featured } = req.body;
  try {
    await pool.query(
      "UPDATE caps SET name=?, team=?, year=?, `condition`=?, price=?, description=?, image=?, featured=? WHERE id=?",
      [name, team, year, condition, price, description, image, featured ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/caps/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM caps WHERE id = ?", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORDERS API ---
app.get("/api/orders", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders ORDER BY date DESC");
    // Parse items string back to JSON
    const parsedOrders = rows.map(o => ({ ...o, items: JSON.parse(o.items) }));
    res.json(parsedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  const { userId, userName, items, total, status, paymentMethod, deliveryType } = req.body;
  const id = Date.now().toString();
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  try {
    await pool.query(
      "INSERT INTO orders (id, userId, userName, items, total, status, paymentMethod, deliveryType, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, userId, userName, JSON.stringify(items), total, status, paymentMethod, deliveryType, date]
    );
    res.json({ id, date, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CONTACT API ---
app.get("/api/contact", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM contact LIMIT 1");
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contact", async (req, res) => {
  const { shopName, ownerName, phone, email, address, facebook, instagram, messengerUsername, bio } = req.body;
  try {
    // Upsert logic for a single contact row
    await pool.query("DELETE FROM contact");
    await pool.query(
      "INSERT INTO contact (shopName, ownerName, phone, email, address, facebook, instagram, messengerUsername, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [shopName, ownerName, phone, email, address, facebook, instagram, messengerUsername, bio]
    );
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files from the 'dist' directory
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// API routes must come BEFORE the catch-all route
// [Your existing API routes are already above this]

// Use this specific syntax for Express 5 catch-all routes to support SPA
app.get("/:any(.*)", (req, res) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend build (dist/index.html) not found. Did you run npm run build?");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`NBA Vault Server running on port ${PORT}`));
