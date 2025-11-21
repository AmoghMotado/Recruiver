import { useEffect, useState } from "react";

/**
 * Modal for creating or editing a JD
 */
export default function UploadJDModal({ open, initial = null, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [jd, setJd] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setJd(initial?.jd || "");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim() || !jd.trim()) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      jd: jd.trim(),
      updated: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-2xl card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{initial ? "Edit JD" : "Add New JD"}</h3>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm opacity-80">Job Title</label>
            <input
              className="input w-full mt-1"
              placeholder="e.g., Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm opacity-80">Job Description</label>
            <textarea
              className="textarea w-full mt-1 min-h-[220px]"
              placeholder="Paste or write the JD here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button
              className={`btn primary ${!title.trim() || !jd.trim() ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={!title.trim() || !jd.trim()}
              onClick={handleSave}
            >
              Save JD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
