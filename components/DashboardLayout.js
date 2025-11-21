// components/DashboardLayout.js
import Link from "next/link";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import HeaderNotifications from "./recruiter/HeaderNotifications";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";

export default function DashboardLayout({
  children,
  role = "CANDIDATE",   // "CANDIDATE" | "RECRUITER"
  active = "dashboard", // which sidebar item is active
}) {
  const router = useRouter();
  const roleSafe = String(role || "CANDIDATE").toUpperCase();
  const isCandidate = roleSafe === "CANDIDATE";

  const homeHref =
    roleSafe === "CANDIDATE"
      ? "/candidate/dashboard"
      : "/recruiter/dashboard";

  const portalLabel =
    roleSafe === "CANDIDATE" ? "Candidate Portal" : "Recruiter Portal";

  return (
    <div className="app-root" style={{ minHeight: "100vh" }}>
      {/* ==== SHARED TOP NAVBAR FOR BOTH PORTALS (non-sticky) ==== */}
      <header className="topbar">
        {/* Left: logo + portal label */}
        <div className="flex items-center gap-2">
          <Link
            href={homeHref}
            className="logo"
            style={{ fontSize: 20, textDecoration: "none" }}
          >
            Recruiver
          </Link>
          <span className="hidden sm:inline text-xs text-gray-500 font-medium">
            {portalLabel}
          </span>
        </div>

        {/* Center nav (Home / About / FAQ) */}
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

        {/* Right: notifications + user menu */}
        <div className="right-actions">
          <HeaderNotifications />
          <UserMenu role={roleSafe} name="User" />
        </div>
      </header>

      {/* ==== MAIN AREA: sticky sidebar + scrollable content ==== */}
      <div className="app-main">
        {/* unified sticky sidebar (styles handled in globals.css) */}
        <Sidebar role={roleSafe} active={active} />

        {/* page content + footer */}
        <div className="page-content">
          {children}
          <Footer basePath={isCandidate ? "/candidate" : "/recruiter"} />
        </div>
      </div>

      {/* 💬 Chat visible for BOTH Candidate & Recruiter dashboards */}
      <ChatWidget />
    </div>
  );
}
