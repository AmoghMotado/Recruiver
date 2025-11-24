// ATS BASIC PAGE - pages/candidate/ats-basic.js
import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";

export default function ATSBasic() {
  const [loading, setLoading] = useState(true);
  const [resumeText, setResumeText] = useState("");
  const [careerLevel, setCareerLevel] = useState("");
  const [fileMeta, setFileMeta] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [atsResult, setAtsResult] = useState(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("recruiver.resume.text");
      const lvl = localStorage.getItem("recruiver.career.level");
      const f = localStorage.getItem("recruiver.resume.file");
      const dataUrl = localStorage.getItem("recruiver.resume.dataUrl");
      const atsRaw = localStorage.getItem("recruiver.ats.general");

      if (t) setResumeText(t);
      if (lvl) setCareerLevel(lvl);
      if (f) setFileMeta(JSON.parse(f));
      if (dataUrl) setPdfUrl(dataUrl);
      if (atsRaw) {
        try {
          setAtsResult(JSON.parse(atsRaw));
        } catch (e) {
          console.error("Failed to parse ATS result from localStorage", e);
        }
      }
    } catch (e) {
      console.error("Error reading localStorage for ATS page", e);
    }

    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const score = useMemo(() => {
    if (atsResult && typeof atsResult.score === "number") {
      return Math.max(0, Math.min(100, Math.round(atsResult.score)));
    }
    if (!resumeText) return 0;
    const len = resumeText.length;
    const est = 30 + Math.min(60, Math.floor(len / 500) * 10);
    return Math.max(10, Math.min(95, est));
  }, [atsResult, resumeText]);

  const breakdown = atsResult?.breakdown || null;

  const backendEnhancements =
    atsResult?.enhancements && atsResult.enhancements.length
      ? atsResult.enhancements
      : atsResult?.suggestions && atsResult.suggestions.length
      ? atsResult.suggestions
      : null;

  const suggestions =
    backendEnhancements ||
    [
      "Ensure all core sections (Summary, Experience, Education, Skills, Projects) are present.",
      "Add more quantified achievements to show measurable impact.",
      "Keep formatting clean with consistent bullets and alignment.",
    ];

  const isPdf = fileMeta?.name && /\.pdf$/i.test(fileMeta.name);

  const paramConfig = [
    ["sections", "Sections & Structure"],
    ["formatting", "Formatting"],
    ["parseability", "Parse-ability"],
    ["length", "Length Suitability"],
    ["readability", "Sentence Readability"],
    ["contact", "Contact Information"],
    ["richness", "Content Richness"],
    ["keywords", "Technical Keywords"],
    ["balance", "Overall Balance"],
  ];

  const getScoreColorClass = (value) => {
    if (value == null || Number.isNaN(value)) return "text-gray-400";
    if (value < 40) return "text-red-600";
    if (value < 70) return "text-amber-600";
    return "text-emerald-600";
  };

  const getBadgeBgClass = (value) => {
    if (value == null || Number.isNaN(value)) return "bg-gray-100";
    if (value < 40) return "bg-red-50 border-red-200";
    if (value < 70) return "bg-amber-50 border-amber-200";
    return "bg-emerald-50 border-emerald-200";
  };

  const handleDownloadReport = async () => {
    if (!atsResult) {
      alert("Run an ATS analysis from the Resume ATS page first.");
      return;
    }
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Recruiver ATS Report", 14, 20);

      doc.setFontSize(11);
      doc.text(`Overall ATS Score: ${Math.round(score)}/100`, 14, 30);
      if (careerLevel) {
        doc.text(`Career Level: ${careerLevel}`, 14, 36);
      }

      let y = 48;
      doc.setFontSize(12);
      doc.text("Parameter Breakdown", 14, y);
      y += 8;
      doc.setFontSize(10);

      const bd = atsResult.breakdown || {};
      paramConfig.forEach(([key, label]) => {
        const v = typeof bd[key] === "number" ? Math.round(bd[key]) : null;
        const line = `${label}: ${v != null ? v + "/100" : "N/A"}`;
        doc.text(line, 14, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });

      if (backendEnhancements && backendEnhancements.length) {
        y += 6;
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.text("AI-Based Suggestions", 14, y);
        y += 8;
        doc.setFontSize(10);
        backendEnhancements.forEach((s) => {
          const lines = doc.splitTextToSize(s, 180);
          doc.text(lines, 14, y);
          y += lines.length * 5 + 3;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
      }

      doc.save("recruiver-ats-report.pdf");
    } catch (err) {
      console.error("Failed to generate PDF report", err);
      alert(
        "Could not generate PDF. Make sure 'jspdf' is installed with `npm install jspdf`."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="parse-loader">
          <div className="filetab">Parsing resume…</div>
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
        <style jsx>{`
          .parse-loader {
            width: 280px;
            padding: 16px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.06);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          }
          .filetab {
            font-weight: 600;
            margin-bottom: 10px;
          }
          .bar {
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(
              90deg,
              rgba(99, 102, 241, 0.2),
              rgba(6, 182, 212, 0.9),
              rgba(99, 102, 241, 0.2)
            );
            background-size: 200% 100%;
            animation: flow 1.2s linear infinite;
            margin-top: 10px;
          }
          @keyframes flow {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: 0% 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 pt-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - Score & Enhancements */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600 mb-4">
                {careerLevel ? `Career Level: ${careerLevel}` : "Career Level: Not specified"}
              </div>
              <ScoreRing score={score} label="ATS Score" />
              <p className="text-sm text-gray-600 mt-6">
                Score generated from AI-based parsing of your uploaded resume
              </p>
            </div>
          </div>

          {/* Enhancements Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              💡 AI-Based Enhancements
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Suggestions tailored to improve your resume's ATS performance
            </p>
            <ul className="space-y-3">
              {suggestions.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-indigo-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-gray-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MIDDLE COLUMN - Parameter Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Parameter Breakdown
            </h2>
            <p className="text-sm text-gray-600">
              Each parameter is scored out of 100. Your overall ATS score is a weighted combination of these signals.
            </p>
          </div>

          {breakdown ? (
            <div className="space-y-3">
              {paramConfig.map(([key, label]) => {
                const raw = breakdown[key];
                const value = typeof raw === "number" ? Math.round(raw) : null;
                const color = getScoreColorClass(value);
                const badgeBg = getBadgeBgClass(value);

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border ${badgeBg} bg-white/40`}
                  >
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span
                      className={`text-lg font-bold ${color}`}
                    >
                      {value != null ? value : "--"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              Run an ATS analysis from the <strong>Resume ATS</strong> page to see detailed metrics
            </div>
          )}

          <button
            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            onClick={handleDownloadReport}
            disabled={!atsResult}
          >
            📥 Download Report
          </button>
        </div>

        {/* RIGHT COLUMN - Resume Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 overflow-hidden flex flex-col shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Resume Preview</h2>
          <div className="flex-1 overflow-auto bg-gray-900 rounded-lg p-4">
            {isPdf && pdfUrl ? (
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <p className="text-sm text-gray-300 p-4">
                  PDF preview unavailable. Download and open manually.
                </p>
              </object>
            ) : (
              <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">
                {resumeText || "No resume found. Go to Resume ATS and upload one."}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score = 72, label = "Score" }) {
  const radius = 62;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" className="block">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99,102,241,1)" />
            <stop offset="100%" stopColor="rgba(6,182,212,1)" />
          </linearGradient>
        </defs>
        <circle
          stroke="rgba(226,232,240,0.9)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="80"
          cy="80"
        />
        <circle
          stroke="url(#g)"
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          r={normalizedRadius}
          cx="80"
          cy="80"
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fill="#111827"
        >
          {pct}
        </text>
      </svg>
      <div className="text-base font-semibold text-gray-600 mt-3">{label}</div>
    </div>
  );
}

ATSBasic.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="resume">
      {page}
    </Layout>
  );
};