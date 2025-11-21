// components/PublicLayout.js
import Link from "next/link";
import Footer from "./Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col app-root">
      {/* Shared topbar with brand + nav */}
      <header className="topbar">
        <Link href="/" className="flex items-center gap-2">
          <span className="logo text-lg leading-none">Recruiver</span>
          <span className="hidden sm:inline text-xs text-gray-500">
            Smart Hiring Platform
          </span>
        </Link>

        <div className="center-nav">
          <Link href="/" className="center-nav-item">
            Home
          </Link>
          <Link href="/about" className="center-nav-item">
            About
          </Link>
          <Link href="/faq" className="center-nav-item">
            FAQ
          </Link>
        </div>

        <div className="right-actions ml-auto">
          <Link href="/auth/login" className="btn ghost text-sm">
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      <footer className="app-footer">
        <Footer basePath="" />
      </footer>
    </div>
  );
}
