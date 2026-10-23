const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Node.js + PostgreSQL API is running!" });
});

//A health endpoint helps you verify that both your Express server and PostgreSQL database are reachable.
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "OK",
      database: "Connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "ERROR",
      database: "Unavailable",
    });
  }
});

// GET: all users
app.get("/api/users", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name, role FROM users ORDER BY id",
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST: create a user
app.post("/api/users", async (req, res, next) => {
  const { name, role } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof role !== "string" ||
    !role.trim() ||
    name.trim().length > 100 ||
    role.trim().length > 100
  ) {
    return res.status(400).json({
      message: "Name and role are required (maximum 100 characters each)",
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (name, role) VALUES ($1, $2) RETURNING id, name, role",
      [name.trim(), role.trim()],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT: update a user
app.put("/api/users/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  const { name, role } = req.body;

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof role !== "string" ||
    !role.trim() ||
    name.trim().length > 100 ||
    role.trim().length > 100
  ) {
    return res.status(400).json({ message: "Invalid user ID, name or role" });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, role = $2
       WHERE id = $3
       RETURNING id, name, role`,
      [name.trim(), role.trim(), id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE: remove a user
app.delete("/api/users/:id", async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// POST: register a user
app.post("/api/auth/register", async (req, res, next) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    password.length < 8 ||
    name.trim().length > 100 ||
    email.trim().length > 255
  ) {
    return res.status(400).json({
      message:
        "Valid name and email are required; password must be at least 8 characters",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
      "SELECT id FROM auth_users WHERE email = $1",
      [normalizedEmail],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO auth_users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, passwordHash],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    // Handle concurrent registration attempts for the same email.
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    next(error);
  }
});

// Handle unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
      ? err.status
      : 500;

  res.status(status).json({
    message: status < 500 ? err.message : "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
