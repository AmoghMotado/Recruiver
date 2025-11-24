// components/recruiter/HrModal.js
import { useState, useEffect } from "react";

export default function HrModal({
  open,
  onClose,
  onConfirm,
  candidateName,
  jobTitle,
}) {
  const [hrDateTime, setHrDateTime] = useState("");
  const [hrLocation, setHrLocation] = useState("");
  const [hrInstructions, setHrInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // reset form when modal opens
      setHrDateTime("");
      setHrLocation("");
      setHrInstructions("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setSubmitting(true);
    try {
      await onConfirm?.({
        hrDateTime: hrDateTime || null,
        hrLocation: hrLocation || "",
        hrInstructions: hrInstructions || "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Select for Final HR Round
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              This will send an HR round email to{" "}
              <span className="font-semibold">
                {candidateName || "the candidate"}
              </span>{" "}
              for{" "}
              <span className="font-semibold">
                {jobTitle || "this position"}
              </span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              HR Interview Date & Time
            </label>
            <input
              type="datetime-local"
              value={hrDateTime}
              onChange={(e) => setHrDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Optional, but recommended so the candidate receives a clear
              schedule.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Office Location
            </label>
            <input
              type="text"
              placeholder="e.g. Recruiver HQ, Baner, Pune"
              value={hrLocation}
              onChange={(e) => setHrLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Additional Instructions (optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Carry 2 passport photos, arrive 15 mins early, dress formal, etc."
              value={hrInstructions}
              onChange={(e) => setHrInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? "Sending email..." : "Confirm & Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
