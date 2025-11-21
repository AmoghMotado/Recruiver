import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function ResumeATS() {
  const router = useRouter();

  // Shared persisted state
  const [savedFile, setSavedFile] = useState(null); // { name }
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [lastSource, setLastSource] = useState(null); // "A" or "B" (for UI only)

  // Refs
  const resumeInputA = useRef(null);
  const resumeInputB = useRef(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const f = localStorage.getItem("recruiver.resume.file");
      const t = localStorage.getItem("recruiver.resume.text");
      const jd = localStorage.getItem("recruiver.jd.text");
      const src = localStorage.getItem("recruiver.resume.source");
      if (f) setSavedFile(JSON.parse(f));
      if (t) setResumeText(t);
      if (jd) setJdText(jd);
      if (src) setLastSource(src);
    } catch {}
  }, []);

  const fileToDataURL = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handleResumeUpload = async (file, source) => {
    if (!file) return;
    const name = file.name;
    const text = await file.text(); // kept for mock "extracted text"
    let dataUrl = "";
    try {
      if (/\.pdf$/i.test(name)) {
        dataUrl = await fileToDataURL(file); // to preview PDF in results pages
        localStorage.setItem("recruiver.resume.mime", "application/pdf");
        localStorage.setItem("recruiver.resume.dataUrl", dataUrl);
      } else {
        localStorage.removeItem("recruiver.resume.dataUrl");
        localStorage.removeItem("recruiver.resume.mime");
      }
      localStorage.setItem("recruiver.resume.file", JSON.stringify({ name }));
      localStorage.setItem("recruiver.resume.text", text);
      localStorage.setItem("recruiver.resume.source", source);
    } catch {}
    setSavedFile({ name });
    setResumeText(text);
    setLastSource(source);
  };

  // Redirect-based chooser flow
  const onGenerateGeneral = () => {
    localStorage.setItem("recruiver.next.route", "/candidate/ats-basic");
    router.push("/candidate/choose-level");
  };

  const onGenerateMatch = () => {
    localStorage.setItem("recruiver.next.route", "/candidate/ats-match");
    router.push("/candidate/choose-level");
  };

  const dropStyles =
    "flex items-center justify-center border-2 border-dashed rounded-xl p-6 hover:bg-black/5 transition cursor-pointer text-sm";

  const canGeneral = !!resumeText;
  const canMatch = !!resumeText && jdText.trim().length > 0;

  const labelFor = (slot) => {
    if (lastSource === slot && savedFile?.name) return savedFile.name;
    return "Drop or click to upload your resume";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-semibold">Resume ATS (AI)</h1>
        <p className="text-sm opacity-80 mt-1">
          Run a quick ATS-style check or compare your resume against a company’s JD. (Frontend demo)
        </p>
      </div>

      {/* Two-column cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A – General */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Resume ATS (General)</h2>
          <div
            className={dropStyles}
            onClick={() => resumeInputA.current?.click()}
            role="button"
            aria-label="Upload resume for general ATS"
          >
            <div className="text-center">
              <div className="font-medium">{labelFor("A")}</div>
              <div className="text-xs opacity-70 mt-1">Accepted: .pdf, .doc, .docx, .txt</div>
            </div>
          </div>
          <input
            ref={resumeInputA}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleResumeUpload(e.target.files?.[0], "A")}
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              className={`btn primary ${!canGeneral ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={onGenerateGeneral}
              disabled={!canGeneral}
            >
              Generate ATS
            </button>
            <span className="text-xs opacity-70">Requires a resume</span>
          </div>
        </div>

        {/* Card B – Compare with JD */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Compare ATS with JD (Company)</h2>
          <div
            className={dropStyles}
            onClick={() => resumeInputB.current?.click()}
            role="button"
            aria-label="Upload resume for JD match"
          >
            <div className="text-center">
              <div className="font-medium">{labelFor("B")}</div>
              <div className="text-xs opacity-70 mt-1">Accepted: .pdf, .doc, .docx, .txt</div>
            </div>
          </div>
          <input
            ref={resumeInputB}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleResumeUpload(e.target.files?.[0], "B")}
          />

          <div className="mt-4">
            <label className="text-sm font-medium">Job Description (paste)</label>
            <textarea
              className="textarea mt-2 w-full min-h-[140px]"
              placeholder="Paste the JD here…"
              value={jdText}
              onChange={(e) => {
                const v = e.target.value;
                setJdText(v);
                try {
                  localStorage.setItem("recruiver.jd.text", v);
                } catch {}
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              className={`btn primary ${!canMatch ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={onGenerateMatch}
              disabled={!canMatch}
            >
              Generate ATS Match
            </button>
            <span className="text-xs opacity-70">Requires resume &amp; JD</span>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="opacity-70">Tip: You can view or manage your saved resume anytime.</div>
        <Link href="/candidate/resume-view" className="btn outline">
          View Resume
        </Link>
      </div>
    </div>
  );
}

ResumeATS.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="resume">
      {page}
    </Layout>
  );
};
