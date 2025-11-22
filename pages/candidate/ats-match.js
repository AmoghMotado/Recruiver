// pages/candidate/ats-match.js
import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";

export default function ATSMatch() {
  const [loading, setLoading] = useState(true);
  const [atsResult, setAtsResult] = useState(null);
  const [careerLevel, setCareerLevel] = useState("");
  const [fileMeta, setFileMeta] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recruiver.ats.match");
      const lvl = localStorage.getItem("recruiver.career.level");
      const f = localStorage.getItem("recruiver.resume.file");
      const dataUrl = localStorage.getItem("recruiver.resume.dataUrl");

      if (raw) setAtsResult(JSON.parse(raw));
      if (lvl) setCareerLevel(lvl);
      if (f) setFileMeta(JSON.parse(f));
      if (dataUrl) setPdfUrl(dataUrl);
    } catch (err) {
      console.error("Failed to hydrate ATS match data:", err);
    } finally {
      const t = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(t);
    }
  }, []);

  const matchScore = useMemo(() => {
    if (atsResult && typeof atsResult.score === "number") {
      return Math.max(0, Math.min(100, Math.round(atsResult.score)));
    }
    return 0;
  }, [atsResult]);

  const general = atsResult?.general;
  const match = atsResult?.match || {};

  const isPdf = fileMeta?.name && /\.pdf$/i.test(fileMeta.name);

  const normalizeKeyword = (kw) => {
    if (!kw) return "";
    let s = String(kw).trim();
    if (s.length > 40) return "";
    s = s.replace(/^[^\w#+.]+|[^\w#+.]+$/g, "");
    s = s.replace(/[\u0000-\u001f]+/g, "");
    const letterCount = (s.match(/[a-zA-Z]/g) || []).length;
    if (!letterCount) return "";
    if (/^%pdf/i.test(s)) return "";
    if (/^\/font/i.test(s)) return "";
    return s;
  };

  const makeKeywordList = (rawList = [], max = 20) => {
    const clean = [];
    const seen = new Set();
    (rawList || []).forEach((kw) => {
      const norm = normalizeKeyword(kw);
      if (!norm) return;
      const lower = norm.toLowerCase();
      if (seen.has(lower)) return;
      seen.add(lower);
      clean.push(norm);
    });
    const visible = clean.slice(0, max);
    const remaining = Math.max(0, clean.length - visible.length);
    return { visible, remaining, total: clean.length };
  };

  const matchedKw = makeKeywordList(match.matchedKeywords || [], 14);
  const jdMissingKw = makeKeywordList(match.jdMissingKeywords || [], 10);
  const resumeOnlyKw = makeKeywordList(match.resumeOnlyKeywords || [], 10);

  const keywordVolumeResume = general?.meta?.keywords?.uniqueTokenCount || 0;
  const keywordVolumeJD = match.jdKeywordCount || match.jdKeywordsCount || 0;

  const jdCoveragePct =
    typeof match.keywordCoverage === "number"
      ? Math.round(match.keywordCoverage * 100)
      : null;

  const semanticPct =
    typeof match.cosineSimilarity === "number"
      ? Math.round(match.cosineSimilarity * 100)
      : null;

  const enhancements =
    atsResult?.enhancements && atsResult.enhancements.length
      ? atsResult.enhancements
      : [
          "Mirror the most important JD keywords directly in your Experience and Skills sections.",
          "Move JD-critical technologies higher in your Skills section and early bullets.",
          "Quantify outcomes that relate to the JD (KPIs, SLAs, performance metrics).",
          "Trim tools and responsibilities that are unrelated to this JD to reduce noise for ATS.",
          "Reuse some of the role-specific phrasing from the JD in your summary and experience bullets.",
        ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="parse-loader">
          <div className="filetab">Evaluating JD vs resume match…</div>
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

  if (!atsResult) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl mx-auto mt-10">
        <h2 className="text-2xl font-bold text-gray-900">No JD match report yet</h2>
        <p className="text-base text-gray-600 mt-3">
          Generate a JD vs Resume ATS match from the <span className="font-semibold">Resume ATS</span> page to see a detailed alignment report here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">JD Match Analysis</h1>
        <p className="text-lg text-gray-600 mt-3">
          See how closely your resume aligns with the job description using keyword matching and semantic similarity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - Match Score & Enhancements */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600 mb-4">
                {careerLevel ? `Career Level: ${careerLevel}` : "Career Level: Not specified"}
              </div>
              <ScoreRing score={matchScore} label="Match Score" />
              <p className="text-sm text-gray-600 mt-6">
                Score reflects how closely your resume aligns with the uploaded JD
              </p>
            </div>
          </div>

          {/* Enhancements Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🎯 JD-Specific Tips
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Tailored suggestions to improve your match score
            </p>
            <ul className="space-y-3">
              {enhancements.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-emerald-600 font-bold flex-shrink-0 mt-0.5">→</span>
                  <span className="text-gray-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MIDDLE COLUMN - Alignment Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            JD vs Resume Alignment
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Snapshot of how well your resume mirrors the JD keywords and language.
          </p>

          <div className="space-y-4">
            {/* Keyword volume */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Keyword Volume
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Resume:</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {keywordVolumeResume}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Job Description:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {keywordVolumeJD}
                  </span>
                </div>
              </div>
            </div>

            {/* JD coverage */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                JD Coverage
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {jdCoveragePct != null ? `${jdCoveragePct}%` : "--"}
              </div>
              <p className="text-xs text-gray-600 mt-2">Target: ≥ 70% of JD keywords</p>
            </div>

            {/* Semantic similarity */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Semantic Similarity
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {semanticPct != null ? `${semanticPct}/100` : "--"}
              </div>
              <p className="text-xs text-gray-600 mt-2">Language overlap analysis</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Resume Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 overflow-hidden flex flex-col">
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
                {general?.rawText || "No resume preview available."}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Keyword Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Matched Keywords */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">✓ Matched Keywords</h3>
          <KeywordDisplay data={matchedKw} />
        </div>

        {/* Missing Keywords */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">⚠ Missing Keywords</h3>
          {jdMissingKw.total === 0 ? (
            <p className="text-sm text-gray-600">No obvious JD keywords missing from your resume. Great match!</p>
          ) : (
            <KeywordDisplay data={jdMissingKw} color="bg-red-50 border-red-200" />
          )}
        </div>

        {/* Resume-Only Keywords */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">ℹ Resume-Only Keywords</h3>
          {resumeOnlyKw.total === 0 ? (
            <p className="text-sm text-gray-600">No extra keywords beyond the JD focus.</p>
          ) : (
            <KeywordDisplay data={resumeOnlyKw} color="bg-blue-50 border-blue-200" />
          )}
        </div>
      </div>
    </div>
  );
}

function KeywordDisplay({ data, color = "bg-green-50 border-green-200" }) {
  const { visible, remaining } = data;

  if (!visible.length) {
    return <p className="text-sm text-gray-600">No keywords in this category.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {visible.map((kw) => (
          <span
            key={kw}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${color}`}
          >
            {kw}
          </span>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-xs text-gray-600 pt-2 border-t border-gray-200">
          +{remaining} more keyword{remaining !== 1 ? "s" : ""}
        </p>
      )}
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
          <linearGradient id="g-match" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(129,140,248,1)" />
            <stop offset="100%" stopColor="rgba(34,197,94,1)" />
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
          stroke="url(#g-match)"
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

ATSMatch.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="resume">
      {page}
    </Layout>
  );
};