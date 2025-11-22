// pages/candidate/resume-ats.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function ResumeATS() {
  const router = useRouter();

  // UI state (labels)
  const [savedFile, setSavedFile] = useState(null);
  const [lastSource, setLastSource] = useState(null);
  const [jdFileMeta, setJdFileMeta] = useState(null);

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

  const canGeneral = !!resumeFile && !loadingGeneral;
  const canMatch = !!resumeFile && !!jdFile && !loadingMatch;

  const labelFor = (slot) => {
    if (lastSource === slot && savedFile?.name) return savedFile.name;
    return "Drop or click to upload your resume";
  };

  const jdLabel =
    jdFileMeta?.name || "Drop or click to upload the job description";

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Resume ATS Analysis</h1>
        <p className="text-lg text-gray-600 mt-3">
          Optimize your resume with AI-powered ATS scoring. Analyze general compatibility or match against specific job descriptions.
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT CARD – General ATS */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">General ATS Score</h2>
              <p className="text-base text-gray-600 mt-2">
                Get an overall ATS compatibility score for your resume
              </p>
            </div>
            <div className="text-4xl">📄</div>
          </div>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer mb-6 text-center"
            onClick={() => resumeInputA.current?.click()}
            role="button"
            aria-label="Upload resume for general ATS"
          >
            <div className="text-5xl mb-4">📤</div>
            <div className="text-lg font-bold text-gray-900">
              {lastSource === "A" && savedFile?.name ? savedFile.name : "Upload Your Resume"}
            </div>
            <div className="text-sm text-gray-600 mt-3">
              Drag and drop or click to browse
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Accepted formats: PDF, DOC, DOCX, TXT
            </div>
            {lastSource === "A" && savedFile?.name && (
              <div className="text-xs text-indigo-600 font-medium mt-3 flex items-center justify-center gap-2">
                ✓ File loaded
              </div>
            )}
          </div>
          <input
            ref={resumeInputA}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleResumeUpload(e.target.files?.[0], "A")}
          />

          {/* Button */}
          <button
            className={`w-full px-6 py-3 rounded-lg font-bold text-base transition-all ${
              canGeneral
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={onGenerateGeneral}
            disabled={!canGeneral}
          >
            {loadingGeneral ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Analyzing Resume…
              </span>
            ) : (
              "Generate ATS Score"
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            {canGeneral ? (
              <span className="text-green-600 font-medium">✓ Ready to generate</span>
            ) : (
              "Upload a resume to get started"
            )}
          </p>
        </div>

        {/* RIGHT CARD – JD Match */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Match with Job Description</h2>
              <p className="text-base text-gray-600 mt-2">
                Compare your resume against a specific company JD
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>

          {/* Resume Upload */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-900 mb-3">Your Resume</div>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer text-center"
              onClick={() => resumeInputB.current?.click()}
              role="button"
              aria-label="Upload resume for JD match"
            >
              <div className="text-3xl mb-2">📄</div>
              <div className="text-sm font-bold text-gray-900">
                {lastSource === "B" && savedFile?.name ? savedFile.name : "Upload Resume"}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Click to browse
              </div>
            </div>
            <input
              ref={resumeInputB}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleResumeUpload(e.target.files?.[0], "B")}
            />
          </div>

          {/* JD Upload */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-900 mb-3">Job Description</div>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer text-center"
              onClick={() => jdInput.current?.click()}
              role="button"
              aria-label="Upload job description file"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="text-sm font-bold text-gray-900">
                {jdFileMeta?.name ? jdFileMeta.name : "Upload JD"}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Click to browse
              </div>
            </div>
            <input
              ref={jdInput}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleJDUpload(e.target.files?.[0])}
            />
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              lastSource === "B" && savedFile?.name
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-200"
            }`}>
              <span className="text-lg">{lastSource === "B" && savedFile?.name ? "✓" : "○"}</span>
              <span className="text-xs font-medium text-gray-700">Resume</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              jdFileMeta?.name
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-200"
            }`}>
              <span className="text-lg">{jdFileMeta?.name ? "✓" : "○"}</span>
              <span className="text-xs font-medium text-gray-700">JD File</span>
            </div>
          </div>

          {/* Button */}
          <button
            className={`w-full px-6 py-3 rounded-lg font-bold text-base transition-all ${
              canMatch
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={onGenerateMatch}
            disabled={!canMatch}
          >
            {loadingMatch ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Comparing Resume…
              </span>
            ) : (
              "Generate Match Score"
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            {canMatch ? (
              <span className="text-green-600 font-medium">✓ Ready to generate</span>
            ) : (
              "Upload both files to get started"
            )}
          </p>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">View Your Resume</h3>
            <p className="text-base text-gray-600 mt-1">
              Manage and preview your saved resume at any time
            </p>
          </div>
          <Link 
            href="/candidate/resume-view" 
            className="px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-all whitespace-nowrap"
          >
            View Resume
          </Link>
        </div>
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