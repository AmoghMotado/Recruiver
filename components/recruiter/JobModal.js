// components/recruiter/JobModal.js
import { useEffect, useState } from "react";

export default function JobModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salaryRange: "",
    experience: "",
    deadline: "",
    description: "",
    status: "Open",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setForm({
        title: initial.title || "",
        company: initial.company || "",
        location: initial.location || "",
        salaryRange: initial.salaryRange || "",
        experience: initial.experience || "",
        deadline: initial.deadline || "",
        description: initial.description || "",
        status: initial.status || "Open",
      });
      setFile(null);
    } else if (open && !initial) {
      setForm({
        title: "",
        company: "",
        location: "",
        salaryRange: "",
        experience: "",
        deadline: "",
        description: "",
        status: "Open",
      });
      setFile(null);
    }
  }, [open, initial]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop().toLowerCase();
      if (!["pdf", "doc", "docx"].includes(ext)) {
        alert("Only PDF, DOC, and DOCX files are allowed");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields: everything except Location and Job Description (Text)
    if (!form.title.trim()) {
      alert("Job title is required");
      return;
    }
    if (!form.company.trim()) {
      alert("Company name is required");
      return;
    }
    if (!form.experience.trim()) {
      alert("Experience is required");
      return;
    }
    if (!form.salaryRange.trim()) {
      alert("Salary range is required");
      return;
    }
    if (!form.deadline) {
      alert("Application deadline is required");
      return;
    }
    if (!form.status) {
      alert("Status is required");
      return;
    }

    setUploading(true);

    try {
      let jdFilePath = initial?.jdFilePath || "";

      // If user uploaded a new file, upload it first
      if (file) {
        const formData = new FormData();
        formData.append("jd", file);

        const uploadRes = await fetch("/api/jobs/upload-jd", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload job description file");
        }

        const uploadData = await uploadRes.json();
        jdFilePath = uploadData.filePath;
      }

      // Save job with file path
      onSave({
        ...form,
        id: initial?.id,
        jdFilePath,
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl card max-h-[90vh] overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            {initial ? "Edit Job Posting" : "Add New Job Posting"}
          </h2>

          {/* Job Title (required) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Company (required) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. TechCorp Inc."
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Location & Experience */}
          <div className="grid grid-cols-2 gap-4">
            {/* Location (optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="e.g. Remote, NYC"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Experience (required) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Experience <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) =>
                  setForm({ ...form, experience: e.target.value })
                }
                placeholder="e.g. 3-5 years"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Salary Range & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            {/* Salary Range (required) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Salary Range <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.salaryRange}
                onChange={(e) =>
                  setForm({ ...form, salaryRange: e.target.value })
                }
                placeholder="e.g. $120k - $180k"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Application Deadline (required) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Application Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Job Description (Text) – optional */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Description (Text)
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={6}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Upload Job Description File (optional, no star) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Job Description (PDF/Word)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
            />
            {file && (
              <p className="text-xs text-green-400 mt-2">
                Selected: {file.name}
              </p>
            )}
            {initial?.jdFilePath && !file && (
              <p className="text-xs text-blue-400 mt-2">
                Current file: {initial.jdFilePath.split("/").pop()}
              </p>
            )}
          </div>

          {/* Status (required) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="btn primary flex-1"
              disabled={uploading}
            >
              {uploading
                ? "Saving..."
                : initial
                ? "Update Job"
                : "Create Job"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn ghost flex-1"
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
