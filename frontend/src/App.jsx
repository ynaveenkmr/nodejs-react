
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/users";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const isEditing = editingId !== null;
    const url = isEditing
      ? `${API_URL}/${editingId}`
      : API_URL;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      setName("");
      setRole("");
      setEditingId(null);

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(user) {
    setEditingId(user.id);
    setName(user.name);
    setRole(user.role);
    setError("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      if (editingId === id) {
        resetForm();
      }

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setName("");
    setRole("");
    setEditingId(null);
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <h1>Node.js Interview Practice</h1>
      <h2>User Management</h2>

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="name">Name</label>
          <br />
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            style={{ padding: 8, width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="role">Role</label>
          <br />
          <input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            maxLength={100}
            style={{ padding: 8, width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : editingId !== null
              ? "Update User"
              : "Add User"}
        </button>

        {editingId !== null && (
          <button type="button" onClick={resetForm} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        )}
      </form>

      <hr />

      <h2>Users ({users.length})</h2>

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found. Add your first user.</p>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            style={{
              border: "1px solid #ccc",
              padding: 16,
              marginBottom: 12,
              borderRadius: 8,
            }}
          >
            <strong>{user.name}</strong>
            <p>{user.role}</p>

            <button type="button" onClick={() => handleEdit(user)}>
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleDelete(user.id)}
              style={{ marginLeft: 8 }}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </main>
  );
}

export default App;
