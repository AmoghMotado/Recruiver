// pages/auth/forgot.js
import { useState } from "react";
import Link from "next/link";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email");
    try {
      setStatus("sending");
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: 720 }}>
        <h1 className="auth-title">Forgot Password</h1>

        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Enter your account email and we will send instructions to reset your password.
        </p>

        <form onSubmit={submit} style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button
              type="submit"
              className="primary-btn"
              disabled={status === "sending"}
              aria-busy={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send reset link"}
            </button>

            <Link href="/" className="primary-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              Back to Login
            </Link>
          </div>

          {status === "sent" && <p style={{ color: "#7dd3fc", marginTop: 14 }}>If this email exists we sent reset instructions (stub).</p>}
          {status === "error" && <p style={{ color: "#fb7185", marginTop: 14 }}>Failed to send. Try again later.</p>}
        </form>
      </div>
    </main>
  );
}
