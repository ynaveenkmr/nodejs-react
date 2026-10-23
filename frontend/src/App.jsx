import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/users";
const AUTH_URL = "http://localhost:5000/api/auth";

function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Login
  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setPassword("");
      setPage("profile");
      setMessage("Login successful");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Restore the profile when an existing token is present
  useEffect(() => {
    if (!token) return;

    let active = true;

    async function restoreSession() {
      try {
        const response = await fetch(`${AUTH_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Session expired");
        }

        if (active) {
          setUser(data);
          setPage("profile");
        }
      } catch {
        if (active) {
          localStorage.removeItem("token");
          setToken("");
          setUser(null);
          setPage("login");
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const handlePageChange = useCallback(
    (nextPage) => {
      setError("");
      setMessage("");
      setPage(nextPage);

      if (nextPage === "users" && token) {
        void fetchUsers();
      }
    },
    [fetchUsers, token],
  );

  // Add or update a user
  async function handleSubmit(event) {
    event.preventDefault();

    const isEditing = editingId !== null;
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

      resetForm();
      setMessage(isEditing ? "User updated" : "User added");
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(selectedUser) {
    setEditingId(selectedUser.id);
    setName(selectedUser.name);
    setRole(selectedUser.role);
    setError("");
    setMessage("");
  }

  // Delete a user
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      if (editingId === id) resetForm();

      setMessage("User deleted");
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

  // Change password
  async function handleChangePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${AUTH_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password update failed");
      }

      handleLogout();
      setMessage("Password updated. Please log in again.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setUsers([]);
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    resetForm();
    setPage("login");
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1>User Portal</h1>

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
        {message && (
          <p role="status" style={styles.success}>
            {message}
          </p>
        )}

        {page === "login" && (
          <form onSubmit={handleLogin}>
            <h2>Login</h2>

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {page !== "login" && (
          <nav style={styles.nav}>
            <button onClick={() => handlePageChange("profile")}>Profile</button>
            <button onClick={() => handlePageChange("users")}>
              User Management
            </button>
            <button onClick={() => handlePageChange("changePassword")}>
              Change Password
            </button>
            <button onClick={handleLogout}>Logout</button>
          </nav>
        )}

        {page === "profile" && (
          <>
            <h2>My Profile</h2>
            <p>
              <strong>Name:</strong> {user?.name || "Loading..."}
            </p>
            <p>
              <strong>Email:</strong> {user?.email || ""}
            </p>
            <p>
              Use the navigation above to manage users or change your password.
            </p>
          </>
        )}

        {page === "changePassword" && (
          <form onSubmit={handleChangePassword}>
            <h2>Change Password</h2>

            <label>Current Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <button disabled={saving}>
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {page === "users" && (
          <>
            <h2>User Management</h2>

            <form onSubmit={handleSubmit}>
              <label>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />

              <label>Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                maxLength={100}
                required
              />

              <button disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update User"
                    : "Add User"}
              </button>

              {editingId !== null && (
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </form>

            <hr />

            <h3>Users ({users.length})</h3>

            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              users.map((item) => (
                <article key={item.id} style={styles.userCard}>
                  <strong>{item.name}</strong>
                  <p>{item.role}</p>

                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </article>
              ))
            )}
          </>
        )}
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 800,
    marginTop: 30,
    padding: 24,
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
  },
  nav: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  userCard: {
    border: "1px solid #ccc",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  error: { color: "red" },
  success: { color: "green" },
};

export default App;
