// pages/index.js – Full Screen Hero Layout
import { useState } from "react";
import Link from "next/link";

function BrandMark() {
  return (
    <div
      style={{
        height: 56,
        width: 56,
        borderRadius: 9999,
        background: "linear-gradient(135deg,#4f46e5,#6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 26px rgba(79,70,229,0.45)",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M12 5l6 11H6l6-11z" />
      </svg>
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("CANDIDATE");

  async function handleLogin(e) {
    e?.preventDefault?.();
    if (!email || !pwd) return alert("Please enter email and password.");

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pwd, role }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 403) {
          alert(data.error || "Role mismatch — please select the correct role.");
          return;
        }
        if (res.status === 401) {
          alert(data.error || "Invalid credentials.");
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      const apiRole = String(
        (data && (data.user?.role || data.role)) || ""
      ).toUpperCase();
      const destination =
        apiRole === "RECRUITER" ? "/recruiter/dashboard" : "/candidate/dashboard";
      window.location.href = destination;
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = `/api/auth/google?role=${encodeURIComponent(role)}`;
  }

  const primaryBtnStyle = {
    background: "linear-gradient(90deg,#4f46e5,#6366f1)",
    color: "#fff",
    fontWeight: 600,
    padding: "13px 28px",
    borderRadius: 999,
    border: "none",
    boxShadow: "0 10px 24px rgba(79,70,229,0.35)",
    cursor: "pointer",
    flex: 1,
    fontSize: "15px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 0,
        margin: 0,
        background:
          "radial-gradient(circle at top,#e0e7ff 0,#f8fafc 42%,#eff6ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section
        style={{
          width: "min(1400px, 100% - 32px)",
          maxHeight: "95vh",
          margin: "0 auto",
          borderRadius: 32,
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(148,163,184,0.28)",
          boxShadow: "0 30px 80px rgba(15,23,42,0.24)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
          gap: 0,
        }}
      >
        {/* LEFT – hero copy */}
        <div
          style={{
            padding: "64px 56px",
            borderRight: "1px solid rgba(226,232,240,0.85)",
            background:
              "radial-gradient(circle at 0% 0%,#e0ecff 0,#e5e7ff 40%,#eef2ff 100%)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <BrandMark />
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 26,
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                }}
              >
                Recruiver
              </div>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#64748b",
                  marginTop: 6,
                  fontWeight: 600,
                }}
              >
                Smart hiring platform
              </div>
            </div>
          </div>

          <h1
            style={{
              marginTop: 48,
              fontSize: 48,
              lineHeight: 1.15,
              color: "#020617",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Hire smarter with{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg,#4f46e5,#6366f1,#22d3ee)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              AI
            </span>
          </h1>

          <p
            style={{
              marginTop: 20,
              fontSize: 16,
              color: "#475569",
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            One workspace for resume ATS checks, mock aptitude tests and
            recruiter analytics — built to keep both candidates and hiring teams
            in sync.
          </p>

          <ul
            style={{
              marginTop: 36,
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: 16,
              fontSize: 15,
              color: "#475569",
            }}
          >
            <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ color: "#4f46e5", fontWeight: "bold", fontSize: "18px" }}>✓</span>
              <span>JD-based resume screening with clear ATS scores.</span>
            </li>
            <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ color: "#4f46e5", fontWeight: "bold", fontSize: "18px" }}>✓</span>
              <span>Camera-ready mock aptitude & AI interviews.</span>
            </li>
            <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ color: "#4f46e5", fontWeight: "bold", fontSize: "18px" }}>✓</span>
              <span>SaaS-grade dashboards for recruiters and candidates.</span>
            </li>
          </ul>
        </div>

        {/* RIGHT – login card */}
        <div
          style={{
            padding: "64px 56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(circle at 100% 0,#eef2ff 0,#f8fafc 46%,#eff6ff 100%)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#ffffff",
              borderRadius: 24,
              padding: 36,
              boxShadow: "0 18px 48px rgba(15,23,42,0.16)",
              border: "1px solid rgba(226,232,240,0.9)",
            }}
          >
            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                textAlign: "center",
                color: "#020617",
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
            >
              Log in
            </h2>
            <p
              style={{
                textAlign: "center",
                fontSize: 14,
                color: "#64748b",
                marginBottom: 28,
                lineHeight: 1.5,
              }}
            >
              Access your candidate or recruiter dashboard in a few seconds.
            </p>

            {/* Email */}
            <label
              className="label"
              style={{
                fontSize: 14,
                color: "#0f172a",
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Email address
            </label>
            <input
              className="input"
              style={{
                width: "100%",
                padding: "11px 14px",
                fontSize: 14,
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                marginBottom: 18,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password */}
            <label
              className="label"
              style={{
                fontSize: 14,
                color: "#0f172a",
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Password
            </label>
            <input
              className="input"
              style={{
                width: "100%",
                padding: "11px 14px",
                fontSize: 14,
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                marginBottom: 18,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              type="password"
              placeholder="Enter your password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />

            {/* Role */}
            <div style={{ marginBottom: 24 }}>
              <label
                className="label"
                style={{
                  fontSize: 14,
                  color: "#0f172a",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Login as
              </label>
              <select
                className="input"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  fontSize: 14,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: "white",
                  cursor: "pointer",
                }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="CANDIDATE">Candidate</option>
                <option value="RECRUITER">Recruiter</option>
              </select>
            </div>

            {/* Actions */}
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  ...primaryBtnStyle,
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? "Logging in…" : "Login"}
              </button>

              <Link
                href="/auth/forgot"
                style={{
                  ...primaryBtnStyle,
                  textAlign: "center",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Forgot password
              </Link>
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogle}
              style={{
                marginBottom: 20,
                width: "100%",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "11px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
                color: "#111827",
                boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
              }}
            >
              <span
                style={{
                  height: 20,
                  width: 20,
                  borderRadius: 4,
                  overflow: "hidden",
                  display: "inline-block",
                }}
              >
                {/* Google "G" */}
                <svg viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6 1.54 7.38 2.84l5.4-5.4C33.64 4.36 29.27 2 24 2 14.82 2 7.09 7.98 4.24 16.26l6.91 5.37C12.45 15.27 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#34A853"
                    d="M46.14 24.5c0-1.55-.14-3.04-.4-4.5H24v9h12.7c-.55 2.96-2.23 5.48-4.74 7.18l7.37 5.72C43.9 38.24 46.14 31.88 46.14 24.5z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M11.15 28.13A14.5 14.5 0 0 1 10 24c0-1.44.25-2.83.7-4.13l-6.9-5.37A21.96 21.96 0 0 0 2 24c0 3.53.84 6.87 2.33 9.8l6.82-5.67z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M24 46c5.9 0 10.86-1.95 14.48-5.3l-7.37-5.72C29.36 36.35 26.88 37.5 24 37.5c-6.26 0-11.55-5.77-12.85-13.13l-6.91 5.37C7.09 40.02 14.82 46 24 46z"
                  />
                </svg>
              </span>
              <span>Sign in with Google</span>
            </button>

            <div
              style={{
                textAlign: "center",
                fontSize: 14,
                color: "#64748b",
              }}
            >
              New here?{" "}
              <Link
                href="/auth/select-role"
                style={{
                  color: "#4f46e5",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Create a free account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}