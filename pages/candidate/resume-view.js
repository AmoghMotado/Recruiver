import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout";

export default function ResumeView() {
  const [fileMeta, setFileMeta] = useState(null); // { name }
  const [resumeText, setResumeText] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [editing, setEditing] = useState(false);
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
    const text = await file.text();
    const meta = { name: file.name };
    try {
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
    } catch {}
    setFileMeta(meta);
    setResumeText(text);
  };

  const onDelete = () => {
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
  };

  const onSave = () => {
    setEditing(false);
  };

  const hasResume = !!(resumeText || pdfUrl);

  const isPdf = fileMeta?.name && /\.pdf$/i.test(fileMeta.name);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Saved Resume</h1>
            <div className="text-sm opacity-75">{fileMeta?.name || "No file saved"}</div>
          </div>
          <div className="flex items-center gap-2">
            {hasResume && (
              <button className="btn outline" onClick={() => setEditing((v) => !v)}>
                {editing ? "Cancel" : "Edit"}
              </button>
            )}
            {hasResume && (
              <button className="btn ghost" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {!hasResume && (
        <div className="card">
          <h3 className="font-semibold mb-2">No resume found</h3>
          <p className="text-sm opacity-80 mb-3">Upload a resume to save and preview it here.</p>
          <div
            className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 hover:bg-black/5 transition cursor-pointer"
            onClick={() => uploadRef.current?.click()}
            role="button"
            aria-label="Upload resume"
          >
            Click to upload (.pdf, .doc, .docx, .txt)
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <div className="mt-4">
            <button
              className={`btn primary ${!fileMeta ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={onSave}
              disabled={!fileMeta}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {hasResume && (
        <>
          {editing && (
            <div className="card">
              <h3 className="font-semibold mb-2">Replace Resume</h3>
              <div
                className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 hover:bg-black/5 transition cursor-pointer"
                onClick={() => uploadRef.current?.click()}
                role="button"
                aria-label="Upload resume replacement"
              >
                Click to upload a new file (.pdf, .doc, .docx, .txt)
              </div>
              <input
                ref={uploadRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
              <div className="mt-4">
                <button className="btn primary" onClick={onSave}>
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-lg mb-2">Preview</h3>
            {isPdf && pdfUrl ? (
              <object data={pdfUrl} type="application/pdf" className="w-full h-[700px] rounded-lg">
                <p className="text-sm">PDF preview unavailable. Download and open manually.</p>
              </object>
            ) : (
              <pre className="text-sm whitespace-pre-wrap opacity-90">{resumeText}</pre>
            )}
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
