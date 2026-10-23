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
