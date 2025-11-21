import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";

export default function ATSBasic() {
  const [loading, setLoading] = useState(true);
  const [rewrite, setRewrite] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [careerLevel, setCareerLevel] = useState("");
  const [fileMeta, setFileMeta] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("recruiver.resume.text");
    const lvl = localStorage.getItem("recruiver.career.level");
    const f = localStorage.getItem("recruiver.resume.file");
    const dataUrl = localStorage.getItem("recruiver.resume.dataUrl");
    if (t) setResumeText(t);
    if (lvl) setCareerLevel(lvl);
    if (f) setFileMeta(JSON.parse(f));
    if (dataUrl) setPdfUrl(dataUrl);
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const rewritten = useMemo(() => {
    if (!rewrite || !resumeText) return resumeText || "";
    let s = resumeText;
    s = s.replace(/\bresponsible\b/gi, "led");
    s = s.replace(/\bworked on\b/gi, "delivered");
    return s;
  }, [rewrite, resumeText]);

  const baseScore = useMemo(() => {
    const len = (resumeText || "").length;
    const est = 30 + Math.min(60, Math.floor(len / 500) * 10);
    return Math.max(10, Math.min(95, est));
  }, [resumeText]);

  const score = Math.min(100, baseScore + (rewrite ? 5 : 0));

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
            background: linear-gradient(90deg, rgba(99,102,241,.2), rgba(6,182,212,.9), rgba(99,102,241,.2));
            background-size: 200% 100%;
            animation: flow 1.2s linear infinite;
            margin-top: 10px;
          }
          @keyframes flow {
            0% { background-position: 200% 0; }
            100% { background-position: 0% 0; }
          }
        `}</style>
      </div>
    );
  }

  const isPdf = fileMeta?.name && /\.pdf$/i.test(fileMeta.name);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_1fr] gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        <div className="card flex flex-col items-center gap-3">
          <div className="text-sm opacity-75">Career Level: {careerLevel || "—"}</div>
          <ScoreRing score={score} label="ATS Score" />
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-2">Keywords &amp; Factors</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {[
              "Clear section headers (Experience, Education, Skills)",
              "Action verbs and measurable impact",
              "Consistent formatting & readable fonts",
              "Relevant keywords for your domain",
              "Avoid images/tables for critical content",
            ].map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Center Column */}
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-lg">AI-Based Enhancements (layout)</h3>
            <button
              className={`btn outline ${!resumeText ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={!resumeText}
              onClick={() => setRewrite((v) => !v)}
            >
              {rewrite ? "Rewrite: ON" : "Rewrite: OFF"}
            </button>
          </div>
          <ul className="list-disc pl-5 mt-3 space-y-1 text-sm">
            <li>Use strong action verbs (e.g., led, delivered, designed).</li>
            <li>Quantify achievements (percentages, revenue, users).</li>
            <li>Keep bullet lines concise (≤ 20 words).</li>
            <li>Prioritize recent, relevant work experiences.</li>
            <li>Group skills by category and seniority relevance.</li>
          </ul>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-lg mb-2">Resume Preview</h3>
          {isPdf && pdfUrl ? (
            <object data={pdfUrl} type="application/pdf" className="w-full h-[600px] rounded-lg">
              <p className="text-sm">PDF preview unavailable. Download and open manually.</p>
            </object>
          ) : (
            <pre className="text-sm whitespace-pre-wrap opacity-90">
              {rewritten || "No resume found. Go to Resume ATS and upload one."}
            </pre>
          )}
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
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fontWeight="700">
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
