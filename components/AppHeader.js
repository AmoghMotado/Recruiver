import Link from "next/link";

// Shared height used everywhere for padding / sticky sidebar
export const TOPBAR_H = 72; // keep in sync with sidebar / app-main

export default function AppHeader({
  homeHref = "/",
  roleLabel, // "Candidate Portal" | "Recruiter Portal" | "Smart Hiring Platform"
  rightSlot, // JSX for right side (notifications+user OR Login button)
}) {
  return (
    <header
      className="topbar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        padding: "14px 22px",
        gap: 16,
        boxSizing: "border-box",
        height: TOPBAR_H,
      }}
    >
      {/* Left: logo + label */}
      <div className="flex items-center gap-2">
        <Link
          href={homeHref}
          className="logo"
          style={{ fontSize: 22, textDecoration: "none" }}
        >
          Recruiver
        </Link>
        {roleLabel && (
          <span className="hidden sm:inline text-xs text-gray-500 font-medium">
            {roleLabel}
          </span>
        )}
      </div>

      {/* Center nav */}
      <nav className="center-nav">
        <Link
          href={homeHref}
          className="center-nav-item"
          aria-current="page"
        >
          Home
        </Link>
        <Link href="/about" className="center-nav-item">
          About
        </Link>
        <Link href="/faq" className="center-nav-item">
          FAQ
        </Link>
      </nav>

      {/* Right actions */}
      <div className="right-actions">{rightSlot}</div>
    </header>
  );
}
