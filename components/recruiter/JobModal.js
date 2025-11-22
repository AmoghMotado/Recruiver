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
        // initial.deadline from table is already pretty string, but for editing
        // we prefer raw YYYY-MM-DD if available on the job object
        deadline: initial.rawDeadline || "",
        description: initial.description || "",
        status: initial.status || "Open",
        id: initial.id,
        jdFilePath: initial.jdFilePath || "",
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

    if (!form.title.trim()) return alert("Job title is required");
    if (!form.company.trim()) return alert("Company name is required");
    if (!form.experience.trim()) return alert("Experience is required");
    if (!form.salaryRange.trim()) return alert("Salary range is required");
    if (!form.deadline) return alert("Application deadline is required");

    setUploading(true);
    try {
      let jdFilePath = form.jdFilePath || initial?.jdFilePath || "";

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

      await onSave({
        ...form,
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
            {form.id ? "Edit Job Posting" : "Add New Job Posting"}
          </h2>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Frontend Developer"
              className="input"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. TechCorp Inc."
              className="input"
            />
          </div>

          {/* Location & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="e.g. Remote, Pune"
                className="input"
              />
            </div>
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
                placeholder="e.g. 0–2 years"
                className="input"
              />
            </div>
          </div>

          {/* Salary Range & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="e.g. ₹6 LPA – ₹8 LPA"
                className="input"
              />
            </div>
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
                className="input"
              />
            </div>
          </div>

          {/* Description */}
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
              rows={5}
              className="input"
              style={{ minHeight: 120, resize: "vertical" }}
            />
          </div>

          {/* JD File upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Job Description (PDF/Word)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {file && (
              <p className="text-xs text-emerald-600 mt-1">
                Selected: {file.name}
              </p>
            )}
            {!file && form.jdFilePath && (
              <p className="text-xs text-indigo-600 mt-1">
                Current file: {form.jdFilePath.split("/").pop()}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input"
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="btn flex-1"
              disabled={uploading}
            >
              {uploading
                ? "Saving..."
                : form.id
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
