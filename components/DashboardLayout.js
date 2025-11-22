import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import HeaderNotifications from "./recruiter/HeaderNotifications";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import AppHeader, { TOPBAR_H } from "./AppHeader";

const FOOTER_H = 56; // fixed footer height

export default function DashboardLayout({
  children,
  role = "CANDIDATE", // "CANDIDATE" | "RECRUITER"
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

  // ---- Display name for top-right user chip ----
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    let cancelled = false;

    async function loadName() {
      try {
        const endpoint =
          roleSafe === "RECRUITER"
            ? "/api/profile/recruiter"
            : "/api/profile/candidate";

        const res = await fetch(endpoint);
        if (!res.ok) return;

        const data = await res.json().catch(() => ({}));
        const u = data.user || data || {};
        const first = u.firstName || u.name || "";
        const last = u.lastName || "";
        const full = [first, last].filter(Boolean).join(" ").trim();

        if (!cancelled && full) {
          setDisplayName(full);
        }
      } catch {
        // ignore – UserMenu has its own recruiter LS fallback
      }
    }

    loadName();
    return () => {
      cancelled = true;
    };
  }, [roleSafe]);

  return (
    <div className="app-root" style={{ minHeight: "100vh" }}>
      {/* ==== UNIVERSAL APP HEADER (fixed) ==== */}
      <AppHeader
        homeHref={homeHref}
        roleLabel={portalLabel}
        rightSlot={
          <>
            <HeaderNotifications />
            <UserMenu role={roleSafe} name={displayName} />
          </>
        }
      />

      {/* ==== MAIN AREA: scrollable content between sticky header & footer ==== */}
      <div
        className="app-main"
        style={{
          paddingTop: TOPBAR_H,
          paddingBottom: FOOTER_H,
          paddingLeft: 16,   // ⬅ tighter from left edge
          paddingRight: 16,  // ⬅ tighter from right edge
          columnGap: 16,     // ⬅ smaller gap between sidebar & cards
        }}
      >
        {/* unified sticky sidebar */}
        <Sidebar role={roleSafe} active={active} />

        {/* page content (scrolls) */}
        <div className="page-content">
          {/* removed max-width wrapper so cards move closer to sidebar */}
          {children}
        </div>
      </div>

      {/* ==== STICKY FOOTER – ALWAYS AT BOTTOM ==== */}
      <footer
        className="app-footer"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          height: FOOTER_H,
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <div className="w-full">
          <Footer basePath={isCandidate ? "/candidate" : "/recruiter"} />
        </div>
      </footer>

      {/* 💬 Chat visible for BOTH Candidate & Recruiter dashboards */}
      <ChatWidget />
    </div>
  );
}
