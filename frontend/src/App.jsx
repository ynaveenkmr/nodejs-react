import { useState } from "react";

const API_URL = "http://localhost:5000/api/auth";

export default function App() {
  const [page, setPage] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
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
      setPage("profile");
      setMessage("Login successful!");
      setPassword("");
    } catch (error) {
      setMessage(error.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load profile");
      }

      setUser(data);
      setPage("profile");
    } catch (error) {
      setMessage(error.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 8) {
      setMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/change-password`, {
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

      setMessage("Password updated successfully. Please log in again.");
      handleLogout();
    } catch (error) {
      setMessage(error.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPage("login");
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h2>Node.js User Portal</h2>

        {message && <p role="status">{message}</p>}

        {page === "login" && (
          <form onSubmit={handleLogin}>
            <h3>Login</h3>

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <br />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <br />
            <button disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {page === "profile" && (
          <>
            <h3>My Profile</h3>
            <p>Name: {user?.name || "Loading..."}</p>
            <p>Email: {user?.email || ""}</p>

            <button onClick={loadProfile} disabled={loading}>
              Refresh Profile
            </button>

            <button
              onClick={() => {
                setPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPage("changePassword");
                setMessage("");
              }}
            >
              Change Password
            </button>

            <button onClick={handleLogout}>Logout</button>
          </>
        )}

        {page === "changePassword" && (
          <form onSubmit={handleChangePassword}>
            <h3>Change Password</h3>

            <label>Current Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPage("profile");
                setMessage("");
              }}
            >
              Cancel
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "28px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
  },
};
