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
  port: Number(process.env.MYSQL_PORT) || 17652, 
  ssl: {
    rejectUnauthorized: false 
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- AUTH & USERS API ---
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

app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { role } = req.body;
  try {
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    res.json({ success: true, message: "User role updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const [user] = await pool.query("SELECT email FROM users WHERE id = ?", [req.params.id]);
    if (user.length > 0 && user[0].email === "admin@caps.ph") {
      return res.status(403).json({ error: "The primary admin account cannot be deleted." });
    }
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.status(204).send();
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

// 1. FIXED: GET all master orders (For Admin Dashboard Overview)
app.get("/api/orders", async (req, res) => {
  try {
    // Modified to use a safer column verification fallback fallback ordering fallback
    const [rows] = await pool.query("SELECT * FROM orders");
    
    const parsedOrders = rows.map(o => {
      let parsedItems = [];
      try {
        parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      } catch (e) {
        console.error(`Failed parsing item payload string for order ID: ${o.id}`, e);
        parsedItems = []; // fallback clean array so the UI never hits an uncaught white crash
      }
      return { ...o, items: parsedItems };
    });

    res.json(parsedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. NEW: GET specific user's orders (For Vault History Dashboard View)
app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders WHERE userId = ?", [req.params.userId]);
    
    const parsedOrders = rows.map(o => {
      let parsedItems = [];
      try {
        parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      } catch (e) {
        console.error(`Failed parsing user history profile list item logic for order ID: ${o.id}`, e);
        parsedItems = [];
      }
      return { ...o, items: parsedItems };
    });

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

// Static frontend file routing
app.use(express.static(path.join(__dirname, "dist")));

app.get("/:any*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`NBA Vault Server running on port ${PORT}`));
