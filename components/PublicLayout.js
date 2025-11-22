import Link from "next/link";
import Footer from "./Footer";
import AppHeader, { TOPBAR_H } from "./AppHeader";

const FOOTER_H = 56;

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col app-root">
      {/* Same universal header – candidate style */}
      <AppHeader
        homeHref="/"
        roleLabel="Smart Hiring Platform"
        rightSlot={
          <Link href="/auth/login" className="btn ghost text-sm">
            Login
          </Link>
        }
      />

      <main
        className="flex-1 flex items-center justify-center py-10"
        style={{
          paddingTop: TOPBAR_H,
          paddingBottom: FOOTER_H,
          paddingLeft: 12,
          paddingRight: 12,
          width: "100%",
        }}
      >
        {children}
      </main>

      {/* Sticky footer at the bottom */}
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
          <Footer basePath="" />
        </div>
      </footer>
    </div>
  );
}
