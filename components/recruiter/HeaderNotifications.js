// components/recruiter/HeaderNotifications.js
import { useEffect, useRef, useState } from "react";

export default function HeaderNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem("recruiter.header.notifications");
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        setItems([]);
      }
    } else {
      setItems([
        { text: "3 new applicants for Software Engineer", time: "2m ago" },
        { text: "Interview scheduled with A. Singh", time: "1h ago" },
        { text: "JD updated for Data Analyst", time: "Yesterday" },
      ]);
    }
  }, []);

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

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 grid place-items-center"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-[var(--brand)] text-white px-1.5 py-0.5 rounded-full">
            {Math.min(items.length, 9)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 text-sm font-semibold border-b border-gray-100 bg-gray-50 text-gray-800">
            Notifications
          </div>
          <ul className="max-h-80 overflow-auto">
            {items.map((n, i) => (
              <li key={i} className="px-3 py-3 border-b border-gray-100">
                <div className="text-sm text-gray-800">{n.text}</div>
                <div className="text-xs text-gray-500 mt-1">{n.time}</div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-3 py-4 text-sm text-gray-500">
                No new notifications.
              </li>
            )}
          </ul>
          <div className="p-2">
            <button
              className="btn ghost w-full"
              onClick={() => {
                localStorage.setItem("recruiter.header.notifications", "[]");
                setItems([]);
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
