// pages/auth/select-role.js – Full Screen Hero Layout
import Link from "next/link";

export default function SelectRole() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 0,
        margin: 0,
        background:
          "radial-gradient(circle at top,#e0e7ff 0,#f9fafb 40%,#eff6ff 100%)",
        position: "relative",
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
        {/* LEFT HERO */}
        <aside
          style={{
            padding: "64px 56px",
            borderRight: "1px solid rgba(226,232,240,0.85)",
            background:
              "radial-gradient(circle at 0% 0%,#e0ecff 0,#e5e7ff 40%,#eef2ff 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                height: 56,
                width: 56,
                borderRadius: 16,
                background: "linear-gradient(130deg,#4f46e5,#6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 14px 34px rgba(79,70,229,0.45)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="white"
                aria-hidden
              >
                <path d="M12 5l6 11H6l6-11z" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 26,
                  letterSpacing: "-0.03em",
                  color: "#020617",
                }}
              >
                Recruiver
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginTop: 4,
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
              fontWeight: 800,
              color: "#020617",
              lineHeight: 1.15,
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
              AI.
            </span>
          </h1>

          <p
            style={{
              marginTop: 20,
              fontSize: 16,
              color: "#475569",
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            Choose whether you&apos;re setting up Recruiver for your company or
            using it as an individual candidate. We&apos;ll tune the experience
            around you.
          </p>
        </aside>

        {/* RIGHT – role selection */}
        <section
          style={{
            padding: "64px 56px",
            background:
              "linear-gradient(180deg,#f8fafc 0,#eff6ff 45%,#e5edff 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 28,
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "#4b5563",
                textDecoration: "none",
                background: "#e5edff",
                padding: "10px 16px",
                borderRadius: 999,
                boxShadow: "0 10px 24px rgba(148,163,184,0.35)",
                fontWeight: 600,
              }}
            >
              ← Back to login
            </Link>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              Already have an account?{" "}
              <Link
                href="/"
                style={{
                  color: "#4f46e5",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Log in
              </Link>
            </div>
          </div>

          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#020617",
              marginBottom: 10,
              letterSpacing: "-0.01em",
            }}
          >
            How would you be using Recruiver?
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", marginBottom: 32, lineHeight: 1.5 }}>
            We&apos;ll personalise dashboards, journeys and emails based on your
            role.
          </p>

          <div style={{ display: "grid", gap: 20 }}>
            {/* Recruiter card */}
            <div
              style={{
                borderRadius: 20,
                padding: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                border: "1px solid rgba(148,163,184,0.55)",
                boxShadow: "0 14px 34px rgba(148,163,184,0.35)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#020617",
                  }}
                >
                  I&apos;m a company
                </div>
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    color: "#64748b",
                    maxWidth: 380,
                    lineHeight: 1.6,
                  }}
                >
                  Manage job posts, screen applications and shortlist candidates
                  from one place.
                </p>
                <Link
                  href="/auth/register-recruiter"
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    padding: "12px 24px",
                    borderRadius: 999,
                    background: "linear-gradient(90deg,#4f46e5,#6366f1)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 15,
                    textDecoration: "none",
                    boxShadow: "0 12px 26px rgba(79,70,229,0.4)",
                  }}
                >
                  Continue as recruiter
                </Link>
              </div>

              <div style={{ width: 140, height: 110, marginLeft: 24, flexShrink: 0 }}>
                <svg width="140" height="110" viewBox="0 0 120 90" fill="none">
                  <rect
                    x="4"
                    y="10"
                    width="112"
                    height="70"
                    rx="18"
                    fill="#eef2ff"
                  />
                  <rect x="18" y="28" width="46" height="8" rx="4" fill="#4f46e5" />
                  <rect x="18" y="44" width="32" height="6" rx="3" fill="#a5b4fc" />
                  <circle cx="92" cy="44" r="10" fill="#4f46e5" />
                </svg>
              </div>
            </div>

            {/* Candidate card */}
            <div
              style={{
                borderRadius: 20,
                padding: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                border: "1px solid rgba(148,163,184,0.45)",
                boxShadow: "0 10px 30px rgba(148,163,184,0.25)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#020617",
                  }}
                >
                  I&apos;m an individual
                </div>
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    color: "#64748b",
                    maxWidth: 380,
                    lineHeight: 1.6,
                  }}
                >
                  Optimise your resume, discover roles, track applications and
                  prepare with mock interviews.
                </p>
                <Link
                  href="/auth/register-candidate"
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    padding: "12px 24px",
                    borderRadius: 999,
                    background: "linear-gradient(90deg,#4f46e5,#6366f1)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 15,
                    textDecoration: "none",
                    boxShadow: "0 12px 26px rgba(79,70,229,0.35)",
                  }}
                >
                  Continue as candidate
                </Link>
              </div>

              <div style={{ width: 140, height: 110, marginLeft: 24, flexShrink: 0 }}>
                <svg width="140" height="110" viewBox="0 0 120 90" fill="none">
                  <rect
                    x="4"
                    y="10"
                    width="112"
                    height="70"
                    rx="18"
                    fill="#fefce8"
                  />
                  <circle cx="90" cy="40" r="10" fill="#f59e0b" />
                  <rect x="18" y="30" width="52" height="8" rx="4" fill="#4f46e5" />
                  <rect x="18" y="46" width="40" height="6" rx="3" fill="#c4b5fd" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}