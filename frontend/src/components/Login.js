import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      // persist session
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // keep compatibility with existing code that reads currentUser
      localStorage.setItem("currentUser", JSON.stringify(user));

      onLogin?.(user);
      alert(`Welcome back, ${user.name || user.email}!`);
      navigate("/", { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=1350&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="card p-4 shadow-lg"
        style={{
          width: "380px",
          borderRadius: "15px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <h3 className="text-center mb-3 text-danger fw-bold">🍕 Welcome Back</h3>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger w-100 mt-2 fw-semibold shadow-sm"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center mt-3">
            New user?{" "}
            <button
              type="button"
              className="btn btn-link p-0 text-danger"
              onClick={() => navigate("/register")}
            >
              Register here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
