import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";

export default function ATSMatch() {
  const [loading, setLoading] = useState(true);
  const [rewrite, setRewrite] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [careerLevel, setCareerLevel] = useState("");
  const [fileMeta, setFileMeta] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    const r = localStorage.getItem("recruiver.resume.text");
    const j = localStorage.getItem("recruiver.jd.text");
    const lvl = localStorage.getItem("recruiver.career.level");
    const f = localStorage.getItem("recruiver.resume.file");
    const dataUrl = localStorage.getItem("recruiver.resume.dataUrl");
    if (r) setResumeText(r);
    if (j) setJdText(j);
    if (lvl) setCareerLevel(lvl);
    if (f) setFileMeta(JSON.parse(f));
    if (dataUrl) setPdfUrl(dataUrl);
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const rewrittenResume = useMemo(() => {
    if (!rewrite || !resumeText) return resumeText || "";
    let s = resumeText;
    s = s.replace(/\bresponsible\b/gi, "led");
    s = s.replace(/\bworked on\b/gi, "delivered");
    return s + (s ? "\n\n(Aligned with JD)" : "");
  }, [rewrite, resumeText]);

  const keywords = ["react", "node", "typescript", "sql", "docker", "api", "aws", "agile"];
  const matchScore = useMemo(() => {
    const r = (resumeText || "").toLowerCase();
    const j = (jdText || "").toLowerCase();
    let hits = 0;
    for (const k of keywords) {
      if (r.includes(k) && j.includes(k)) hits += 1;
    }
    const base = 40 + hits * 8;
    const adj = base + (rewrite ? 5 : 0);
    return Math.min(100, Math.max(10, adj));
  }, [resumeText, jdText, rewrite]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="jd-loader">
          <div className="dots">
            <span />
            <span />
            <span />
          </div>
          <div className="scan" />
          <div className="label">Matching with JD…</div>
        </div>
        <style jsx>{`
          .jd-loader {
            width: 280px;
            padding: 16px 14px 10px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.06);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
            text-align: center;
          }
          .dots {
            display: flex;
            gap: 6px;
            justify-content: center;
            margin-bottom: 10px;
          }
          .dots span {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            animation: pulse 1s infinite ease-in-out;
          }
          .dots span:nth-child(2) { animation-delay: .15s; }
          .dots span:nth-child(3) { animation-delay: .3s; }
          .scan {
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(90deg, rgba(34,197,94,.2), rgba(59,130,246,.9), rgba(34,197,94,.2));
            background-size: 200% 100%;
            animation: flow 1.2s linear infinite;
            margin-bottom: 8px;
          }
          .label { font-weight: 600; font-size: 14px; }
          @keyframes pulse {
            0%, 100% { transform: translateY(0); opacity: .6; }
            50% { transform: translateY(-5px); opacity: 1; }
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
          <ScoreRing score={matchScore} label="Match Score" />
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-2">JD Preview</h3>
          <pre className="text-sm whitespace-pre-wrap opacity-90">
            {jdText || "No JD found. Go back and paste a JD."}
          </pre>
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
            <li>Mirror essential JD keywords in your achievements.</li>
            <li>Reorder bullets to prioritize JD-required skills.</li>
            <li>Quantify outcomes related to the JD (KPIs, SLAs).</li>
            <li>Trim unrelated tech to reduce noise for ATS.</li>
            <li>Use role-specific phrasing from the JD where relevant.</li>
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
              {rewrittenResume || "No resume found. Upload in Resume ATS page."}
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
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,197,94,1)" />
            <stop offset="100%" stopColor="rgba(59,130,246,1)" />
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
          stroke="url(#g2)"
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

ATSMatch.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="resume">
      {page}
    </Layout>
  );
};
