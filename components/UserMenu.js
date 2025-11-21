// components/UserMenu.js
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

export default function UserMenu({ name = "User", role = "CANDIDATE" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const roleSafe = String(role || "CANDIDATE").toUpperCase();
  const isCandidate = roleSafe === "CANDIDATE";
  const base = isCandidate ? "/candidate" : "/recruiter";

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_) {}
    try {
      localStorage.removeItem("auth.token");
      localStorage.removeItem("auth.user");
      localStorage.removeItem("auth.role");
    } catch {}
    router.replace("/");
  };

  const initials =
    name && typeof name === "string"
      ? name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="userchip"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar">{initials}</span>
        <span className="name hidden sm:inline">{name}</span>
      </button>

      {open && (
        <div className="dropdown mt-2 right-0" style={{ minWidth: 260 }}>
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
            Signed in as
          </div>
          <div className="px-3 py-2 text-sm font-medium">{name}</div>

          <button
            className="w-full text-left dropdown-item"
            onClick={() => router.push(`${base}/profile`)}
          >
            {isCandidate ? "My Profile" : "Company Profile"}
          </button>
          <button
            className="w-full text-left dropdown-item"
            onClick={() => router.push(`${base}/settings`)}
          >
            Settings
          </button>

          <div className="border-t border-gray-100 mt-1 pt-1" />
          <button
            className="w-full text-left dropdown-item text-red-600"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
