// pages/candidate/ats-basic.js
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

  // prefer backend score, fallback if missing
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

  // Prefer backend enhancements -> fallback text
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

  // parameter config (labels + what we show)
  const paramConfig = [
    ["sections", "Sections & structure"],
    ["formatting", "Formatting"],
    ["parseability", "Parse-ability"],
    ["length", "Length suitability"],
    ["readability", "Sentence readability"],
    ["contact", "Contact information"],
    ["richness", "Content richness"],
    ["keywords", "Technical keywords"],
    ["balance", "Overall balance"],
  ];

  const getScoreColorClass = (value) => {
    if (value == null || Number.isNaN(value)) return "text-gray-400";
    if (value < 40) return "text-red-500";
    if (value < 70) return "text-amber-500";
    return "text-emerald-500";
  };

  const getBadgeBgClass = (value) => {
    if (value == null || Number.isNaN(value)) return "bg-gray-100";
    if (value < 40) return "bg-red-50";
    if (value < 70) return "bg-amber-50";
    return "bg-emerald-50";
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
        const v =
          typeof bd[key] === "number" ? Math.round(bd[key]) : null;
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1.3fr_1.3fr] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center gap-3">
            <div className="text-sm opacity-75">
              Career Level: {careerLevel || "—"}
            </div>
            <ScoreRing score={score} label="ATS Score" />
            <p className="text-xs text-gray-500 text-center mt-1">
              Score generated from AI-based parsing of your uploaded resume.
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-2">
              AI-Based Enhancements
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Suggestions below are generated from your resume’s current
              structure, content, and ATS signals.
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
              {suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* MIDDLE COLUMN */}
        <div className="space-y-4">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div>
                <h3 className="font-semibold text-lg">
                  ATS Parameter Breakdown
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Each parameter is scored out of 100. Your overall ATS score is
                  a weighted combination of these signals from the backend
                  model.
                </p>
              </div>
              <button
                className="btn outline text-xs md:text-sm"
                onClick={handleDownloadReport}
                disabled={!atsResult}
              >
                Download ATS Report
              </button>
            </div>

            {breakdown ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paramConfig.map(([key, label]) => {
                  const raw = breakdown[key];
                  const value =
                    typeof raw === "number" ? Math.round(raw) : null;
                  const color = getScoreColorClass(value);
                  const badgeBg = getBadgeBgClass(value);

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-white/60 text-sm"
                    >
                      <span className="text-gray-700">{label}</span>
                      <span
                        className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeBg} ${color}`}
                      >
                        {value != null ? `${value}/100` : "--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Run an ATS analysis from the <strong>Resume ATS</strong> page to
                see a detailed parameter breakdown here.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-2">Resume Preview</h3>
            {isPdf && pdfUrl ? (
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-[600px] rounded-lg"
              >
                <p className="text-sm">
                  PDF preview unavailable. Download and open manually.
                </p>
              </object>
            ) : (
              <pre className="text-sm whitespace-pre-wrap opacity-90">
                {resumeText ||
                  "No resume found. Go to Resume ATS and upload one."}
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
          stroke="rgba(255,255,255,0.15)"
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
          fontSize="28"
          fontWeight="700"
        >
          {pct}
        </text>
      </svg>
      <div className="text-sm opacity-75">{label}</div>
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
