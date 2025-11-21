import Link from "next/link";
import HeaderNotifications from "@/components/recruiter/HeaderNotifications";
import UserMenu from "@/components/UserMenu";
import UserMenuRecruiter from "@/components/recruiter/UserMenuRecruiter";

export default function Header({ role = "CANDIDATE" }) {
  const isRecruiter = role === "RECRUITER";
  const roleLabel = isRecruiter ? "Recruiter Portal" : "Candidate Portal";

  const homeHref = isRecruiter
    ? "/recruiter/dashboard"
    : "/candidate/dashboard";

  return (
    <header className="topbar">
      {/* LEFT — Logo + Portal name */}
      <div className="flex items-center gap-2">
        <Link href={homeHref} className="logo" style={{ fontSize: 20 }}>
          Recruiver
        </Link>
        <span className="hidden sm:inline text-xs text-gray-500 font-medium">
          {roleLabel}
        </span>
      </div>

      {/* CENTER — Main nav */}
      <nav className="center-nav">
        <Link href={homeHref} className="center-nav-item">
          Home
        </Link>
        <Link href="/about" className="center-nav-item">
          About
        </Link>
        <Link href="/faq" className="center-nav-item">
          FAQ
        </Link>
      </nav>

      {/* RIGHT — Notifications + user menu */}
      <div className="right-actions">
        <HeaderNotifications />
        {isRecruiter ? <UserMenuRecruiter /> : <UserMenu />}
      </div>
    </header>
  );
}
