// src/pages/Cart.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // axios instance that adds Authorization from localStorage
import "bootstrap/dist/css/bootstrap.min.css";

export default function Cart({ user: userProp }) {
  const navigate = useNavigate();

  // Local auth state (fallback if parent didn't pass a ready user)
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(userProp || null);

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upi, setUpi] = useState({ id: "", app: "" });
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Load cart once
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(Array.isArray(saved) ? saved : []);
    } catch {
      setCart([]);
    }
  }, []);

  // Verify auth once (using token in interceptor)
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        // If parent already passed a user, no need to hit /me
        if (userProp) {
          setUser(userProp);
          return;
        }
        const token = localStorage.getItem("token");
        if (!token) return; // not logged in
        const { data } = await api.get("/api/auth/me"); // or "/auth/me" if your api baseURL ends with /api
        if (!cancelled) setUser(data);
      } catch {
        // token invalid/expired — leave user null
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [userProp]);

  // Guard against duplicate alerts/redirects (StrictMode)
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (authLoading) return;                   // wait for auth check
    if (!user && !redirectedRef.current) {
      redirectedRef.current = true;
      alert("Please login to access your cart.");
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // While verifying auth, or immediately after redirecting, render nothing
  if (authLoading || (!user && redirectedRef.current)) return null;

  const grandTotal = cart.reduce(
    (sum, x) => sum + Number(x.price || 0) * Number(x.qty || 0),
    0
  );
  const gst = grandTotal * 0.05;
  const delivery = grandTotal > 0 ? 40 : 0;
  const finalTotal = grandTotal + gst + delivery;

  const proceedToPay = () => {
    if (!address.trim()) return alert("Please enter your delivery address.");
    if (!paymentMethod) return alert("Select a payment method first.");
    if (paymentMethod === "UPI" && (!upi.id || !upi.app)) {
      return alert("Please fill UPI ID and select UPI App.");
    }

    const draft = {
      cart,
      total: Number(finalTotal.toFixed(2)),
      method: paymentMethod,
      address: address.trim(),
      notes: notes.trim(),
    };
    sessionStorage.setItem("checkoutDraft", JSON.stringify(draft));
    navigate("/payment", { state: draft });
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center py-5"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('https://images.unsplash.com/photo-1627366422957-3efa9c6df0fc?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <div className="card shadow-lg p-4 rounded-4" style={{ width: "100%", maxWidth: 700, backgroundColor: "#fff" }}>
        <h2 className="text-center text-danger fw-bold mb-4">🛒 My Cart</h2>

        {cart.length === 0 ? (
          <div className="text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
              alt="Empty Cart"
              style={{ width: 120, opacity: 0.8 }}
            />
            <h5 className="mt-3 text-muted">Your cart is empty!</h5>
            <p>Start exploring restaurants and add some delicious food 🍽</p>
            <button className="btn btn-danger mt-2 px-4" onClick={() => navigate("/restaurants")}>
              🍴 Go to Restaurants
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="mb-4">
              {cart.map((item, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between border-bottom py-3">
                  <div className="text-start">
                    <h6 className="fw-bold text-dark mb-1">{item.name}</h6>
                    <p className="text-muted small mb-0">Qty: {item.qty} × ₹{item.price}</p>
                  </div>
                  <h6 className="text-danger fw-semibold">₹{Number(item.price || 0) * Number(item.qty || 0)}</h6>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-top pt-3 pb-2 mb-4" style={{ borderColor: "#ddd" }}>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span><span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>GST (5%)</span><span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Delivery Fee</span><span>₹{delivery.toFixed(2)}</span>
              </div>
              <h5 className="d-flex justify-content-between fw-bold text-danger border-top pt-3">
                <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
              </h5>
            </div>

            {/* Address */}
            <div className="mb-4">
              <h5 className="fw-bold text-dark mb-3">🏠 Delivery Address</h5>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter your full delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <h6 className="fw-semibold text-dark mb-2">📝 Order Notes (Optional)</h6>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Any special instructions? (e.g. no onions, ring the bell once)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Payment */}
            <div className="text-center mb-4">
              <h5 className="fw-bold text-dark mb-3">Select Payment Method</h5>
              <div className="d-flex justify-content-center gap-4">
                <div>
                  <input type="radio" name="method" value="COD" id="cod" onChange={(e) => setPaymentMethod(e.target.value)} />
                  <label htmlFor="cod" className="ms-2">💵 Cash on Delivery</label>
                </div>
                <div>
                  <input type="radio" name="method" value="UPI" id="upi" onChange={(e) => setPaymentMethod(e.target.value)} />
                  <label htmlFor="upi" className="ms-2">💳 UPI Payment</label>
                </div>
              </div>

              {paymentMethod === "UPI" && (
                <div className="bg-light p-3 mt-4 rounded-4 shadow-sm" style={{ maxWidth: 400, margin: "auto" }}>
                  <h6 className="fw-bold text-danger mb-3">UPI Details</h6>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Enter your UPI ID"
                    value={upi.id}
                    onChange={(e) => setUpi({ ...upi, id: e.target.value })}
                  />
                  <select
                    className="form-select"
                    value={upi.app}
                    onChange={(e) => setUpi({ ...upi, app: e.target.value })}
                  >
                    <option value="">Select UPI App</option>
                    <option value="Google Pay">Google Pay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="BHIM">BHIM</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="text-center">
              <button className="btn btn-danger px-5 py-2 fw-semibold" onClick={proceedToPay} disabled={cart.length === 0}>
                Proceed to Payment →
              </button>
              <div className="mt-3">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/restaurants")}>
                  ← Back to Restaurants
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
