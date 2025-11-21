// pages/candidate/resume-ats.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function ResumeATS() {
  const router = useRouter();

  // UI state (labels)
  const [savedFile, setSavedFile] = useState(null);      // { name }
  const [lastSource, setLastSource] = useState(null);    // "A" | "B"
  const [jdFileMeta, setJdFileMeta] = useState(null);    // { name }

  // Actual File objects (for backend)
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);

  // Loading flags
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Refs
  const resumeInputA = useRef(null);
  const resumeInputB = useRef(null);
  const jdInput = useRef(null);

  // Hydrate labels from localStorage (only names)
  useEffect(() => {
    try {
      const f = localStorage.getItem("recruiver.resume.file");
      const jdFileStored = localStorage.getItem("recruiver.jd.file");
      const src = localStorage.getItem("recruiver.resume.source");

      if (f) setSavedFile(JSON.parse(f));
      if (jdFileStored) setJdFileMeta(JSON.parse(jdFileStored));
      if (src) setLastSource(src);
    } catch {
      // ignore
    }
  }, []);

  const fileToDataURL = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  // Resume upload (used by both cards)
  const handleResumeUpload = async (file, source) => {
    if (!file) return;
    const name = file.name;

    // Keep File in memory for this tab
    setResumeFile(file);

    try {
      // Store preview only for PDFs
      if (/\.pdf$/i.test(name)) {
        const dataUrl = await fileToDataURL(file);
        localStorage.setItem("recruiver.resume.mime", "application/pdf");
        localStorage.setItem("recruiver.resume.dataUrl", dataUrl);
      } else {
        localStorage.removeItem("recruiver.resume.dataUrl");
        localStorage.removeItem("recruiver.resume.mime");
      }

      // Meta for labels / other pages
      localStorage.setItem("recruiver.resume.file", JSON.stringify({ name }));
      localStorage.setItem("recruiver.resume.source", source);
    } catch {
      // ignore
    }

    setSavedFile({ name });
    setLastSource(source);
  };

  // JD upload (right card only)
  const handleJDUpload = async (file) => {
    if (!file) return;
    const name = file.name;

    setJdFile(file);

    try {
      localStorage.setItem("recruiver.jd.file", JSON.stringify({ name }));
    } catch {
      // ignore
    }

    setJdFileMeta({ name });
  };

  // GENERAL ATS (resume only)
  const onGenerateGeneral = async () => {
    if (!resumeFile) {
      alert(
        "Please upload a resume in the 'Resume ATS (General)' card before generating the ATS score."
      );
      return;
    }

    try {
      setLoadingGeneral(true);

      const formData = new FormData();
      formData.append("resume", resumeFile);

      const res = await fetch("/api/ats/general", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        alert(
          data.message ||
            "Something went wrong while generating your ATS score."
        );
        return;
      }

      localStorage.setItem("recruiver.ats.general", JSON.stringify(data));
      localStorage.setItem("recruiver.next.route", "/candidate/ats-basic");

      router.push("/candidate/ats-basic");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while generating ATS score.");
    } finally {
      setLoadingGeneral(false);
    }
  };

  // JD MATCH ATS (resume + JD)
  const onGenerateMatch = async () => {
    if (!resumeFile) {
      alert(
        "Please upload your resume in the right card (top box) before generating ATS Match."
      );
      return;
    }
    if (!jdFile) {
      alert(
        "Please upload the company Job Description (JD) before generating ATS Match."
      );
      return;
    }

    try {
      setLoadingMatch(true);

      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jd", jdFile);

      const res = await fetch("/api/ats/match", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        alert(data.message || "Failed to generate ATS match score.");
        return;
      }

      localStorage.setItem("recruiver.ats.match", JSON.stringify(data));
      localStorage.setItem("recruiver.next.route", "/candidate/ats-match");

      router.push("/candidate/ats-match");
    } catch (err) {
      console.error(err);
      alert("Failed to generate ATS match score.");
    } finally {
      setLoadingMatch(false);
    }
  };

  const dropStyles =
    "flex items-center justify-center border-2 border-dashed rounded-xl p-6 hover:bg-black/5 transition cursor-pointer text-sm";

  const canGeneral = !!resumeFile && !loadingGeneral;
  const canMatch = !!resumeFile && !!jdFile && !loadingMatch;

  const labelFor = (slot) => {
    if (lastSource === slot && savedFile?.name) return savedFile.name;
    return "Drop or click to upload your resume";
  };

  const jdLabel =
    jdFileMeta?.name || "Drop or click to upload the job description (JD)";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-semibold">Resume ATS (AI)</h1>
        <p className="text-sm opacity-80 mt-1">
          Run a quick ATS-style check or compare your resume against a
          company’s JD. This is a frontend demo wired to a custom ATS scoring
          service.
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
              <div className="text-xs opacity-70 mt-1">
                Accepted: .pdf, .doc, .docx, .txt
              </div>
              <div className="text-[11px] opacity-60 mt-1">
                If this file name came from a previous visit, please re-upload
                before running ATS.
              </div>
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
              className={`btn primary ${
                !canGeneral ? "opacity-60 cursor-not-allowed" : ""
              }`}
              onClick={onGenerateGeneral}
              disabled={!canGeneral}
            >
              {loadingGeneral ? "Generating ATS…" : "Generate ATS"}
            </button>
            <span className="text-xs opacity-70">Requires a resume</span>
          </div>
        </div>

        {/* Card B – Compare with JD */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">
            Compare ATS with JD (Company)
          </h2>

          {/* Resume upload for JD match */}
          <div
            className={dropStyles}
            onClick={() => resumeInputB.current?.click()}
            role="button"
            aria-label="Upload resume for JD match"
          >
            <div className="text-center">
              <div className="font-medium">{labelFor("B")}</div>
              <div className="text-xs opacity-70 mt-1">
                Accepted: .pdf, .doc, .docx, .txt
              </div>
              <div className="text-[11px] opacity-60 mt-1">
                The same resume is used for both General and Company ATS.
              </div>
            </div>
          </div>
          <input
            ref={resumeInputB}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleResumeUpload(e.target.files?.[0], "B")}
          />

          {/* JD upload */}
          <div
            className={`${dropStyles} mt-4`}
            onClick={() => jdInput.current?.click()}
            role="button"
            aria-label="Upload job description file"
          >
            <div className="text-center">
              <div className="font-medium">{jdLabel}</div>
              <div className="text-xs opacity-70 mt-1">
                Accepted: .pdf, .doc, .docx, .txt
              </div>
            </div>
          </div>
          <input
            ref={jdInput}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleJDUpload(e.target.files?.[0])}
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              className={`btn primary ${
                !canMatch ? "opacity-60 cursor-not-allowed" : ""
              }`}
              onClick={onGenerateMatch}
              disabled={!canMatch}
            >
              {loadingMatch ? "Generating ATS Match…" : "Generate ATS Match"}
            </button>
            <span className="text-xs opacity-70">
              Requires resume &amp; JD
            </span>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="opacity-70">
          Tip: You can view or manage your saved resume anytime.
        </div>
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
