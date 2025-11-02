// src/pages/Orders.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Orders() {
  const navigate = useNavigate();

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // prevent duplicate redirects/alerts in StrictMode
  const redirectedRef = useRef(false);

  // Detect if api baseURL already includes `/api`
  const baseHasApi =
    typeof api?.defaults?.baseURL === "string" &&
    /\/api\/?$/.test(api.defaults.baseURL);
  const ME_PATH = baseHasApi ? "/auth/me" : "/api/auth/me";
  const ORDERS_PATH = baseHasApi ? "/orders" : "/api/orders";

  // 1) Verify auth first (using token from interceptor/localStorage)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // not logged in
          return;
        }
        const { data } = await api.get(ME_PATH);
        if (!cancelled) setUser(data);
      } catch {
        // token missing/invalid — leave user null
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ME_PATH]);

  // 2) Redirect only AFTER auth check finishes
  useEffect(() => {
    if (authLoading) return;
    if (!user && !redirectedRef.current) {
      redirectedRef.current = true;
      alert("Please login to view your orders.");
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // 3) Load orders once authenticated
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (authLoading || !user) return;
      setLoadingOrders(true);
      try {
        const res = await api.get(ORDERS_PATH);
        const data = Array.isArray(res.data) ? res.data : [];

        // de-duplicate + newest first (defensive)
        const byId = new Map();
        for (const o of data) if (!byId.has(o._id)) byId.set(o._id, o);
        const uniqueSorted = [...byId.values()].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        if (!cancelled) setOrders(uniqueSorted);
      } catch (err) {
        if (!cancelled) {
          alert(err?.response?.data?.message || "Failed to load orders.");
        }
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, ORDERS_PATH]);

  // While verifying, or right after redirecting, render nothing
  if (authLoading || (!user && redirectedRef.current)) return null;

  const noOrders = !loadingOrders && orders.length === 0;

  return (
    <div
      className="py-5"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url('https://images.unsplash.com/photo-1606788075761-676fa0c55288?auto=format&fit=crop&w=1400&q=80')",
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <div className="container">
        {/* Top actions */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          >
            ← Back
          </button>
          <button className="btn btn-outline-danger" onClick={() => navigate("/")}>
            🏠 Home
          </button>
        </div>

        <h2 className="text-danger fw-bold text-center mb-4">📦 My Orders</h2>

        {loadingOrders ? (
          <p className="text-center text-muted">Loading your orders…</p>
        ) : noOrders ? (
          <div className="text-center mt-5">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
              alt="Empty Orders"
              style={{ width: 150, marginBottom: 20, opacity: 0.8 }}
            />
            <h5 className="text-muted mb-3">No orders yet.</h5>
            <button className="btn btn-danger px-4" onClick={() => navigate("/restaurants")}>
              🍴 Go to Restaurants
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {orders.map((order) => (
              <div key={order._id} className="col-md-4">
                <div className="card shadow-sm rounded-4 h-100">
                  <div className="card-body">
                    <h6 className="fw-bold text-danger mb-2">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </h6>
                    <p className="text-muted small mb-2">
                      Placed: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <ul className="list-group mb-3">
                      {order.items.map((it, idx) => (
                        <li key={idx} className="list-group-item d-flex justify-content-between">
                          <span>{(it.name || it?.foodItem?.name || "Item")} × {it.quantity}</span>
                          <span>
                            {typeof it.price === "number"
                              ? `₹${(it.price * it.quantity).toFixed(2)}`
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold">Status: {order.status}</span>
                      <span className="fw-bold text-success">
                        Total: ₹{Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
