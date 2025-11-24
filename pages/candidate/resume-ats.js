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

  // Hydrate labels from localStorage
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

  return (
    <div className="pb-12 pt-6">
      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT CARD – General ATS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-2">
                Base Analysis
              </div>
              <h2 className="text-2xl font-bold text-gray-900">General ATS Score</h2>
              <p className="text-gray-500 text-sm mt-1">
                Get an overall compatibility score and formatting check.
              </p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl text-indigo-600">
              📄
            </div>
          </div>

          {/* Upload Area */}
          <div className="flex-1 flex flex-col">
            <div
              className={`flex-1 border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                 lastSource === "A" && savedFile?.name 
                 ? "border-indigo-300 bg-indigo-50/30" 
                 : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
              }`}
              onClick={() => resumeInputA.current?.click()}
              role="button"
            >
              <div className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl mb-4 transition-transform group-hover:scale-110 ${
                 lastSource === "A" && savedFile?.name ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"
              }`}>
                 {lastSource === "A" && savedFile?.name ? "✓" : "☁️"}
              </div>
              
              <div className="font-bold text-gray-900 text-lg max-w-[250px] truncate">
                {lastSource === "A" && savedFile?.name ? savedFile.name : "Upload Your Resume"}
              </div>
              
              <div className="text-sm text-gray-500 mt-2">
                PDF, DOC, DOCX, TXT
              </div>
            </div>
            <input
              ref={resumeInputA}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleResumeUpload(e.target.files?.[0], "A")}
            />

            {/* Action Button */}
            <button
              className={`w-full mt-6 px-6 py-4 rounded-xl font-bold text-base transition-all transform active:scale-[0.98] ${
                canGeneral
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={onGenerateGeneral}
              disabled={!canGeneral}
            >
              {loadingGeneral ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                "Generate ATS Score"
              )}
            </button>
          </div>
        </div>

        {/* RIGHT CARD – JD Match */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide mb-2">
                Comparison
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Match with JD</h2>
              <p className="text-gray-500 text-sm mt-1">
                Compare your resume against a specific job description.
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl text-blue-600">
              🎯
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {/* Resume Upload Box */}
            <div
              className={`border border-dashed rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors group ${
                lastSource === "B" && savedFile?.name ? "border-blue-300 bg-blue-50/30" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
              onClick={() => resumeInputB.current?.click()}
            >
               <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                  lastSource === "B" && savedFile?.name ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
               }`}>
                  📄
               </div>
               <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {lastSource === "B" && savedFile?.name ? savedFile.name : "Upload Resume"}
                  </div>
                  <div className="text-xs text-gray-500">Click to browse file</div>
               </div>
               <input
                  ref={resumeInputB}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleResumeUpload(e.target.files?.[0], "B")}
                />
            </div>

            {/* JD Upload Box */}
            <div
              className={`border border-dashed rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors group ${
                 jdFileMeta?.name ? "border-blue-300 bg-blue-50/30" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
              onClick={() => jdInput.current?.click()}
            >
               <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                  jdFileMeta?.name ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
               }`}>
                  📋
               </div>
               <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {jdFileMeta?.name ? jdFileMeta.name : "Upload Job Description"}
                  </div>
                  <div className="text-xs text-gray-500">Click to browse file</div>
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
            <div className="grid grid-cols-2 gap-3 pt-2">
               <StatusBadge 
                 label="Resume" 
                 active={!!(lastSource === "B" && savedFile?.name)} 
               />
               <StatusBadge 
                 label="JD File" 
                 active={!!jdFileMeta?.name} 
               />
            </div>

            {/* Action Button */}
            <button
              className={`w-full mt-4 px-6 py-4 rounded-xl font-bold text-base transition-all transform active:scale-[0.98] ${
                canMatch
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={onGenerateMatch}
              disabled={!canMatch}
            >
              {loadingMatch ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Comparing...
                </span>
              ) : (
                "Generate Match Score"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Section - View Resume Link */}
      <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">👁️</div>
           <div>
              <h3 className="font-bold text-gray-900">Already have a resume uploaded?</h3>
              <p className="text-sm text-gray-600">Preview your current file stored in the system.</p>
           </div>
        </div>
        <Link 
          href="/candidate/resume-view" 
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
        >
          View Stored Resume
        </Link>
      </div>
    </div>
  );
}

// Helper Component for the Match Card Indicators (Updated to Blue)
function StatusBadge({ label, active }) {
  return (
    <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
       active ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-gray-50 text-gray-400 border border-gray-100"
    }`}>
       <div className={`w-2 h-2 rounded-full ${active ? "bg-blue-500 animate-pulse" : "bg-gray-300"}`} />
       <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
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