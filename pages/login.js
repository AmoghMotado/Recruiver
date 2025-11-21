import { useRouter } from "next/router";
import { useState } from "react";
import PublicLayout from "../components/PublicLayout";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

// Firebase client
import { auth } from "../lib/firebaseClient";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("auth.role") || "CANDIDATE"
      : "CANDIDATE"
  );
  const [loading, setLoading] = useState(false);

  const signIn = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1) Firebase Auth sign-in
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2) Call backend to enforce role + fetch profile from Firestore
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const apiRole = String(data.user?.role || role).toUpperCase();

      // 3) Persist lightweight user info in localStorage (optional)
      const user = {
        email: data.user?.email || email.trim(),
        role: apiRole,
        name: data.user?.name || email.split("@")[0] || "User",
      };
      try {
        localStorage.setItem("auth.user", JSON.stringify(user));
        localStorage.setItem("auth.role", apiRole);
      } catch {
        // ignore
      }

      // 4) Redirect based on role
      router.replace(
        apiRole === "RECRUITER" ? "/recruiter/dashboard" : "/candidate/dashboard"
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Login failed");
      setLoading(false);
    }
  };

  const RoleButton = ({ value, label }) => {
    const isActive = role === value;
    return (
      <button
        type="button"
        onClick={() => setRole(value)}
        className="btn ghost"
        style={{
          width: "100%",
          justifyContent: "center",
          borderRadius: 999,
          borderColor: isActive ? "#4f46e5" : "#e5e7eb",
          boxShadow: isActive
            ? "0 8px 20px rgba(79,70,229,.22)"
            : "0 0 0 rgba(0,0,0,0)",
          background: isActive
            ? "linear-gradient(90deg,#4f46e5,#4f46e5)"
            : "#ffffff",
          color: isActive ? "#ffffff" : "#4b5563",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="auth-page">
      <div className="login-wrap">
        {/* LEFT: brand / hero – matches site theme */}
        <section className="login-left">
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4f46e5] to-[#6366f1] shadow-lg shadow-indigo-500/30 grid place-items-center text-white font-bold text-lg">
                R
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Recruiver
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Smart hiring platform
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Hire smarter{" "}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4f46e5] to-[#6366f1]">
                  with AI.
                </span>
              </h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Unified dashboards for recruiters and candidates, ATS-ready
                resume insights, and AI-powered mock interviews — all in one
                workspace.
              </p>
            </div>

            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#4f46e5]">✓</span>
                <span>Resume ATS scoring and JD-based recommendations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#4f46e5]">✓</span>
                <span>AI-driven mock interviews with structured feedback.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#4f46e5]">✓</span>
                <span>
                  Recruiter analytics for applications, pipeline and skills.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* RIGHT: login card – light card matching dashboards */}
        <section className="login-right">
          <div className="login-card">
            <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-1">
              Log in
            </h2>
            <p className="text-xs text-center text-slate-500 mb-5">
              Access your candidate or recruiter dashboard in a few seconds.
            </p>

            <form onSubmit={signIn} className="space-y-4">
              {/* Email */}
              <div>
                <label className="label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Role switch */}
              <div>
                <label className="label">Login as</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <RoleButton value="CANDIDATE" label="Candidate" />
                  <RoleButton value="RECRUITER" label="Recruiter" />
                </div>
              </div>

              {/* Primary action */}
              <button
                type="submit"
                className="primary-btn w-full flex items-center justify-center"
                disabled={!email.trim() || !password.trim() || loading}
                style={{
                  opacity:
                    !email.trim() || !password.trim() || loading ? 0.7 : 1,
                }}
              >
                {loading ? "Signing in…" : "Continue"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  or
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google sign-in */}
              <GoogleAuthButton />

              <p className="mt-3 text-xs text-center text-slate-500">
                By continuing, you agree to our{" "}
                <a href="/terms" className="small-link">
                  Terms
                </a>{" "}
                &{" "}
                <a href="/privacy" className="small-link">
                  Privacy
                </a>
                .
              </p>

              <p className="mt-2 text-xs text-center text-slate-500">
                New here?{" "}
                <a
                  href="/auth/select-role"
                  className="small-link font-semibold"
                >
                  Create a free account
                </a>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

LoginPage.getLayout = (page) => <PublicLayout>{page}</PublicLayout>;
