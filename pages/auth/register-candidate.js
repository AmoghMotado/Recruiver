// pages/auth/register-candidate.js
import { useState } from "react";
import Link from "next/link";

export default function RegisterCandidate() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please fill in all required fields (Email and Password).");
      return;
    }
    if (!form.agree) {
      alert("You must accept the Terms & Privacy Policy to register.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // use the shared Firebase-backed register API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          dob: form.dob,
          gender: form.gender,
          password: form.password,
          role: "CANDIDATE",
          agree: form.agree,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      window.location.href = data.redirectTo || "/candidate/dashboard";
    } catch (err) {
      console.error("[register-candidate] submit error", err);
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = "/api/auth/google?role=CANDIDATE";
  }

  return (
    <main className="auth-page">
      <div className="floating-bg" aria-hidden>
        <div className="floating-blob b1" />
        <div className="floating-blob b2" />
        <div className="floating-blob b3" />
      </div>

      <div
        className="auth-card"
        role="region"
        aria-labelledby="candidate-title"
      >
        <h2 id="candidate-title" className="auth-title">
          Create Candidate Account
        </h2>

        <form onSubmit={onSubmit} className="form-grid" autoComplete="on">
          <div className="col">
            <label className="label">First name</label>
            <input
              name="firstName"
              className="input"
              value={form.firstName}
              onChange={onChange}
              placeholder="Amogh"
            />
          </div>

          <div className="col">
            <label className="label">Last name</label>
            <input
              name="lastName"
              className="input"
              value={form.lastName}
              onChange={onChange}
              placeholder="Motado"
            />
          </div>

          <div className="col">
            <label className="label">Email address</label>
            <input
              name="email"
              className="input"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
            />
          </div>

          <div className="col">
            <label className="label">Phone</label>
            <input
              name="phone"
              className="input"
              value={form.phone}
              onChange={onChange}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="col">
            <label className="label">Date of birth</label>
            <input
              name="dob"
              className="input"
              value={form.dob}
              onChange={onChange}
              placeholder="dd-mm-yyyy"
            />
          </div>

          <div className="col">
            <label className="label">Gender</label>
            <select
              name="gender"
              className="input"
              value={form.gender}
              onChange={onChange}
            >
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          <div
            className="col password-wrapper"
            style={{ position: "relative" }}
          >
            <label className="label">Password</label>
            <input
              name="password"
              className="input"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={onChange}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              className="password-toggle"
              onClick={() => setShowPwd((s) => !s)}
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>

          <div
            className="col password-wrapper"
            style={{ position: "relative" }}
          >
            <label className="label">Confirm password</label>
            <input
              name="confirmPassword"
              className="input"
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="Re-enter your password"
            />
            <button
              type="button"
              aria-label="Toggle confirm password visibility"
              className="password-toggle"
              onClick={() => setShowConfirm((s) => !s)}
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="checkbox">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={onChange}
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="link">
                  Terms
                </Link>{" "}
                &amp;{" "}
                <Link href="/privacy" className="link">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <div className="actions-row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Registering…" : "Register"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleGoogle}
              disabled={loading}
            >
              Sign up with Google
            </button>
          </div>

          <div className="help-line" style={{ marginTop: 12 }}>
            Already have an account?{" "}
            <Link href="/" className="login-link">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
