// pages/auth/register-recruiter.js
import { useState } from "react";
import Link from "next/link";

export default function RegisterRecruiter() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    dob: "",
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
          company: form.company,
          dob: form.dob,
          password: form.password,
          role: "RECRUITER",
          agree: form.agree,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      // use redirect path from API if present
      window.location.href = data.redirectTo || "/recruiter/dashboard";
    } catch (err) {
      console.error("[register-recruiter] submit error", err);
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = "/api/auth/google?role=RECRUITER";
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
        aria-labelledby="recruiter-title"
      >
        <h2 id="recruiter-title" className="auth-title">
          Create Recruiter Account
        </h2>

        <form onSubmit={onSubmit} className="form-grid" autoComplete="on">
          <div className="col">
            <label className="label">First name</label>
            <input
              name="firstName"
              className="input"
              value={form.firstName}
              onChange={onChange}
              placeholder="Atharva"
            />
          </div>

          <div className="col">
            <label className="label">Last name</label>
            <input
              name="lastName"
              className="input"
              value={form.lastName}
              onChange={onChange}
              placeholder="Phadtare"
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
              placeholder="you@company.com"
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
            <label className="label">Company</label>
            <input
              name="company"
              className="input"
              value={form.company}
              onChange={onChange}
              placeholder="Your company name"
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
            <button type="submit" className="btn" disabled={loading}>
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
