// components/Layout.js
import Link from "next/link";
import { useRouter } from "next/router";
import Footer from "@/components/Footer";
import UserMenu from "@/components/UserMenu";
import HeaderNotifications from "@/components/recruiter/HeaderNotifications";
import ChatWidget from "@/components/ChatWidget";

import {
  Home,
  User,
  Briefcase,
  FileText,
  BookOpen,
  Settings,
  MessageSquare,
} from "lucide-react";

const TOPBAR_H = 64; // same as RecruiterLayout

export default function Layout({
  children,
  active = "dashboard",
  role = "CANDIDATE",
}) {
  const router = useRouter();

  // pages where we do NOT show app chrome
  const hideOn = [
    "/",
    "/auth/select-role",
    "/auth/forgot",
    "/auth/register-candidate",
    "/auth/register-recruiter",
  ];
  const hideNav = hideOn.includes(router.pathname);

  const roleSafe = String(role || "CANDIDATE").toLowerCase();
  const isCandidate = roleSafe === "candidate";
  const homeHref = hideNav ? "/" : `/${roleSafe}/dashboard`;
  const roleLabel =
    role === "RECRUITER" ? "Recruiter Portal" : "Candidate Portal";

  const menu =
    role === "RECRUITER"
      ? [
          { key: "dashboard", label: "Dashboard", href: `/${roleSafe}/dashboard` },
          { key: "profile", label: "My Profile", href: `/${roleSafe}/profile` },
          {
            key: "job-postings",
            label: "Job Profiles",
            href: `/${roleSafe}/job-profiles`,
          },
          { key: "resume", label: "Resume ATS", href: `/${roleSafe}/resume-ats` },
          {
            key: "mock",
            label: "Mock Test",
            href: `/${roleSafe}/mock-aptitude`,
          },
          {
            key: "ai-mock",
            label: "AI Mock Interview",
            href: "/candidate/ai-mock-interview",
          },
          { key: "forum", label: "Forum", href: `/${roleSafe}/forum` },
          {
            key: "settings",
            label: "Settings",
            href: `/${roleSafe}/settings`,
          },
        ]
      : [
          { key: "dashboard", label: "Dashboard", href: `/${roleSafe}/dashboard` },
          { key: "profile", label: "My Profile", href: `/${roleSafe}/profile` },
          {
            key: "jobs",
            label: "Job Profiles",
            href: `/${roleSafe}/job-profiles`,
          },
          { key: "resume", label: "Resume ATS", href: `/${roleSafe}/resume-ats` },
          {
            key: "mock",
            label: "Mock Test",
            href: `/${roleSafe}/mock-aptitude`,
          },
          {
            key: "ai-mock",
            label: "AI Mock Interview",
            href: "/candidate/ai-mock-interview",
          },
          { key: "forum", label: "Forum", href: `/${roleSafe}/forum` },
          {
            key: "settings",
            label: "Settings",
            href: `/${roleSafe}/settings`,
          },
        ];

  const iconMap = {
    dashboard: Home,
    profile: User,
    "job-postings": Briefcase,
    jobs: Briefcase,
    resume: FileText,
    mock: BookOpen,
    forum: MessageSquare,
    settings: Settings,
  };

  async function handleLogout(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_) {}
    window.location.href = "/";
  }

  // ---------- LAYOUT WITHOUT NAV (auth, landing) ----------
  if (hideNav) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/60 bg-white/90">
          <div className="max-w-[1400px] mx-auto px-6">
            <Footer basePath={isCandidate ? "/candidate" : "/recruiter"} />
          </div>
        </footer>
        {isCandidate && <ChatWidget />}
      </div>
    );
  }

  // ---------- FULL APP LAYOUT (MATCHES RECRUITER) ----------
  return (
    <div className="app-root" style={{ minHeight: "100vh" }}>
      {/* TOP NAVBAR — EXACT same structure as RecruiterLayout, but dynamic role */}
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
        }}
      >
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
            {roleLabel}
          </span>
        </div>

        {/* Center nav (Home / About / FAQ) – EXACT same markup as recruiter */}
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
          <UserMenu role={role} onLogout={handleLogout} />
        </div>
      </header>

      {/* MAIN AREA — same structure as recruiter: app-main with sidebar + content */}
      <div
        style={{
          paddingTop: TOPBAR_H,
          minHeight: "100vh",
        }}
      >
        <div className="app-main">
          {/* Sidebar – mirrors SidebarRecruiter but uses dynamic menu */}
          <aside className="dashboard-sidebar card flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-1">
                Recruiver
              </div>
              <div className="text-sm text-gray-400 mb-4">{roleLabel}</div>

              <nav className="space-y-1">
                {menu.map((item) => {
                  const Icon = iconMap[item.key] || Home;
                  const isActive = active === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "sidebar-link",
                        "w-full",
                        isActive ? "active" : "",
                      ].join(" ")}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Help link at bottom – same style as recruiter sidebar */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <Link
                href={`/${roleSafe}/help`}
                className="sidebar-link text-gray-500 hover:text-gray-700"
              >
                <span className="inline-flex w-4 justify-center text-lg">
                  ?
                </span>
                <span className="truncate text-sm">Help</span>
              </Link>
            </div>
          </aside>

          {/* Page content – same spacing as recruiter (page-content class) */}
          <div className="page-content">
            {children}
            <Footer basePath={isCandidate ? "/candidate" : "/recruiter"} />
          </div>
        </div>
      </div>

      {/* Floating chat bubble – only visible for candidate role */}
      {isCandidate && <ChatWidget />}
    </div>
  );
}
