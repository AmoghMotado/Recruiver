// components/candidate/ApplyJobModal.jsx
import { useState } from "react";

export default function ApplyJobModal({ open, job, onClose, onApplied }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!open || !job) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      alert("Please upload a PDF, DOC or DOCX file");
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your resume first");
      return;
    }
    setUploading(true);
    try {
      // 1) upload resume
      const fd = new FormData();
      fd.append("resume", file);
      const upRes = await fetch("/api/jobs/upload-resume", {
        method: "POST",
        body: fd,
      });
      const upData = await upRes.json().catch(() => ({}));
      if (!upRes.ok) {
        throw new Error(upData?.message || "Failed to upload resume");
      }

      const resumePath = upData.filePath;

      // 2) apply to job with resumePath
      const applyRes = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumePath }),
      });
      const applyData = await applyRes.json().catch(() => ({}));
      if (!applyRes.ok) {
        throw new Error(applyData?.message || "Failed to apply to job");
      }

      alert("Application submitted!");
      onApplied?.(job.id);
      onClose();
    } catch (err) {
      alert(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md card p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Apply to {job.title}
        </h2>
        <p className="text-sm text-gray-600">
          Upload your latest resume before submitting your application.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Resume (PDF / DOC / DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {file && (
              <p className="text-xs text-green-700 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn ghost flex-1"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn flex-1"
              disabled={uploading}
            >
              {uploading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
