import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout";

export default function ResumeView() {
  const [fileMeta, setFileMeta] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(null);

  useEffect(() => {
    try {
      const f = localStorage.getItem("recruiver.resume.file");
      const t = localStorage.getItem("recruiver.resume.text");
      const dataUrl = localStorage.getItem("recruiver.resume.dataUrl");
      if (f) setFileMeta(JSON.parse(f));
      if (t) setResumeText(t);
      if (dataUrl) setPdfUrl(dataUrl);
    } catch {}
  }, []);

  const fileToDataURL = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const meta = { name: file.name, size: file.size };

      if (/\.pdf$/i.test(file.name)) {
        const dataUrl = await fileToDataURL(file);
        localStorage.setItem("recruiver.resume.dataUrl", dataUrl);
        localStorage.setItem("recruiver.resume.mime", "application/pdf");
        setPdfUrl(dataUrl);
      } else {
        localStorage.removeItem("recruiver.resume.dataUrl");
        localStorage.removeItem("recruiver.resume.mime");
        setPdfUrl("");
      }

      localStorage.setItem("recruiver.resume.file", JSON.stringify(meta));
      localStorage.setItem("recruiver.resume.text", text);
      setFileMeta(meta);
      setResumeText(text);
      setEditing(false);
    } catch (err) {
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      try {
        localStorage.removeItem("recruiver.resume.file");
        localStorage.removeItem("recruiver.resume.text");
        localStorage.removeItem("recruiver.resume.dataUrl");
        localStorage.removeItem("recruiver.resume.mime");
      } catch {}
      setFileMeta(null);
      setResumeText("");
      setPdfUrl("");
      setEditing(false);
    }
  };

  const hasResume = !!(resumeText || pdfUrl);
  const isPdf = fileMeta?.name && /\.pdf$/i.test(fileMeta.name);
  const fileSize = fileMeta?.size ? `${(fileMeta.size / 1024).toFixed(1)} KB` : "";

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">My Resume</h1>
        <p className="text-lg text-gray-600 mt-3">
          {hasResume
            ? "Manage your saved resume. Upload a new version anytime to update your profile."
            : "Upload your resume to get started. We'll parse it for ATS scoring and matching."}
        </p>
      </div>

      {!hasResume ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="text-center">
            <div className="text-7xl mb-6">📄</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">No Resume Yet</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload your resume to unlock ATS scoring, job matching, and AI-powered improvements. Your resume helps us find the best opportunities for you.
            </p>

            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-indigo-300 rounded-xl p-12 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer mb-8"
              onClick={() => uploadRef.current?.click()}
              role="button"
              aria-label="Upload resume"
            >
              <div className="text-5xl mb-4">⬆️</div>
              <div className="text-2xl font-bold text-gray-900 mb-2">Drop your resume here</div>
              <div className="text-base text-gray-600">or click to browse</div>
              <div className="text-sm text-gray-500 mt-3">PDF, DOC, DOCX, or TXT (Max 10 MB)</div>
            </div>

            <input
              ref={uploadRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
          </div>
        </div>
      ) : (
        /* Resume Saved State */
        <>
          {/* File Info Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-2">
                  ✓ Resume Saved
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{fileMeta?.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>📊 {fileSize}</span>
                  <span>•</span>
                  <span>
                    {isPdf ? "📑 PDF" : "📝 Text Document"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  {editing ? "✕ Cancel" : "✏️ Replace"}
                </button>
                <button
                  onClick={onDelete}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>

          {/* Replace Upload Section */}
          {editing && (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Replace Your Resume</h3>
              <div
                className="border-2 border-dashed border-indigo-300 rounded-xl p-12 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer"
                onClick={() => !uploading && uploadRef.current?.click()}
                role="button"
                aria-label="Upload resume replacement"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">{uploading ? "⏳" : "⬆️"}</div>
                  <div className="text-lg font-bold text-gray-900">
                    {uploading ? "Uploading..." : "Click to upload new file"}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    PDF, DOC, DOCX, or TXT
                  </div>
                </div>
              </div>
              <input
                ref={uploadRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
                disabled={uploading}
              />
            </div>
          )}

          {/* Preview Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Preview</h3>

            {isPdf && pdfUrl ? (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full"
                  style={{ height: "800px" }}
                >
                  <div className="flex items-center justify-center h-96 bg-gray-900">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📄</div>
                      <p className="text-gray-300 mb-4">PDF preview unavailable</p>
                      <p className="text-sm text-gray-400">Download and open in your PDF reader</p>
                    </div>
                  </div>
                </object>
              </div>
            ) : resumeText ? (
              <div className="bg-gray-50 rounded-lg p-8 max-h-96 overflow-y-auto border border-gray-200">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {resumeText}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">👀</div>
                <p className="text-gray-600">Preview not available</p>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 Resume Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <span className="text-2xl flex-shrink-0">📝</span>
                <div>
                  <div className="font-bold text-gray-900">Keep It Current</div>
                  <p className="text-sm text-gray-700 mt-1">Update your resume regularly with recent experiences and skills</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-2xl flex-shrink-0">🎯</span>
                <div>
                  <div className="font-bold text-gray-900">Use Keywords</div>
                  <p className="text-sm text-gray-700 mt-1">Include skills and keywords from job descriptions to improve ATS matching</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-2xl flex-shrink-0">✨</span>
                <div>
                  <div className="font-bold text-gray-900">Highlight Achievements</div>
                  <p className="text-sm text-gray-700 mt-1">Use numbers and quantifiable results to show impact</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-2xl flex-shrink-0">📐</span>
                <div>
                  <div className="font-bold text-gray-900">Format Clearly</div>
                  <p className="text-sm text-gray-700 mt-1">Use consistent formatting, clear sections, and readable fonts</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

ResumeView.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="resume">
      {page}
    </Layout>
  );
};