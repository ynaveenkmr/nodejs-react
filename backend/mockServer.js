
// const express = require("express");
// const cors = require("cors");

// const app = express();

// app.use(cors());
// app.use(express.json());

// // Root route
// app.get("/", (req, res) => {
//   res.json({ message: "Node.js backend is running!" });
// });

// let users = [
//   { id: 1, name: "Naveen", role: "Frontend Developer" },
//   { id: 2, name: "Rahul", role: "Backend Developer" },
// ];

// // GET: Fetch all users
// app.get("/api/users", (req, res) => {
//   res.json(users);
// });

// // GET: Fetch one user
// app.get("/api/users/:id", (req, res) => {
//   const user = users.find(
//     (u) => u.id === Number(req.params.id)
//   );

//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   res.json(user);
// });

// // POST: Create a user
// app.post("/api/users", (req, res) => {
//   const { name, role } = req.body;

//   if (
//     typeof name !== "string" ||
//     !name.trim() ||
//     typeof role !== "string" ||
//     !role.trim()
//   ) {
//     return res.status(400).json({
//       message: "Valid name and role are required",
//     });
//   }

//   const newUser = {
//     id: Math.max(0, ...users.map((u) => u.id)) + 1,
//     name: name.trim(),
//     role: role.trim(),
//   };

//   users.push(newUser);

//   res.status(201).json(newUser);
// });

// // PUT: Update a user
// app.put("/api/users/:id", (req, res) => {
//   const user = users.find(
//     (u) => u.id === Number(req.params.id)
//   );

//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   const { name, role } = req.body;

//   if (
//     typeof name !== "string" ||
//     !name.trim() ||
//     typeof role !== "string" ||
//     !role.trim()
//   ) {
//     return res.status(400).json({
//       message: "Valid name and role are required",
//     });
//   }

//   user.name = name.trim();
//   user.role = role.trim();

//   res.json(user);
// });

// // DELETE: Delete a user
// app.delete("/api/users/:id", (req, res) => {
//   const userId = Number(req.params.id);
//   const exists = users.some((u) => u.id === userId);

//   if (!exists) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   users = users.filter((u) => u.id !== userId);

//   res.json({ message: "User deleted successfully" });
// });

// app.listen(5000, () => {
//   console.log("Server running at http://localhost:5000");
// });
