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
      // tiny delay so UI feels consistent with general page
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

  // ---------------------------------------------------------------------------
  // Keyword helpers – clean up binary / noisy tokens so UI is readable
  // ---------------------------------------------------------------------------
  const normalizeKeyword = (kw) => {
    if (!kw) return "";
    let s = String(kw).trim();

    // Skip very long or obvious binary-ish tokens
    if (s.length > 40) return "";

    // Remove surrounding punctuation
    s = s.replace(/^[^\w#+.]+|[^\w#+.]+$/g, "");

    // Strip repeated weird characters
    s = s.replace(/[\u0000-\u001f]+/g, "");

    // Ignore tokens that are mostly non-letters
    const letterCount = (s.match(/[a-zA-Z]/g) || []).length;
    if (!letterCount) return "";

    // Ignore classic PDF garbage markers
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
      <div className="card max-w-2xl mx-auto mt-10">
        <h2 className="text-lg font-semibold">No JD match report yet</h2>
        <p className="text-sm text-gray-600 mt-2">
          Generate a JD vs Resume ATS match from the{" "}
          <span className="font-semibold">Resume ATS</span> page to see a
          detailed alignment report here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1.5fr_1.3fr] gap-6">
        {/* LEFT COLUMN: Match score + AI Enhancements */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center gap-3">
            <div className="text-sm opacity-75">
              Career Level: {careerLevel || "—"}
            </div>
            <ScoreRing score={matchScore} label="Match Score" />
            <p className="text-xs text-gray-500 text-center mt-1 px-4">
              Score reflects how closely your resume aligns with the uploaded
              JD (keywords + semantic similarity).
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-2">
              AI-Based Enhancements
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              These are tailored to this specific JD and your current resume
              content.
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
              {enhancements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* MIDDLE COLUMN: JD vs Resume Alignment table */}
        <div className="card h-full overflow-hidden">
          <h3 className="font-semibold text-lg mb-1">
            JD vs Resume Alignment
          </h3>
          <p className="text-xs text-gray-500 mb-4 max-w-3xl">
            Snapshot of how well your resume mirrors the JD keywords and
            language. Aim for strong keyword coverage with focused, relevant
            content.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm align-top border-separate border-spacing-y-1">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-2 pr-4 text-left w-[18%]">Aspect</th>
                  <th className="py-2 px-2 text-left w-[22%]">Resume</th>
                  <th className="py-2 px-2 text-left w-[22%]">
                    Job Description
                  </th>
                  <th className="py-2 pl-4 text-left w-[38%]">Insight</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {/* Keyword volume */}
                <Row>
                  <CellHeading>Keyword volume</CellHeading>
                  <Cell>
                    {keywordVolumeResume
                      ? `${keywordVolumeResume} unique keywords`
                      : "-- keywords"}
                  </Cell>
                  <Cell>
                    {keywordVolumeJD
                      ? `${keywordVolumeJD} JD keywords`
                      : "-- keywords"}
                  </Cell>
                  <Cell>
                    Keep resumes focused on the JD: enough relevant keywords
                    without noise.
                  </Cell>
                </Row>

                {/* JD coverage */}
                <Row>
                  <CellHeading>JD coverage</CellHeading>
                  <Cell>
                    {jdCoveragePct != null
                      ? `${jdCoveragePct}% of JD keywords present`
                      : "Coverage not available"}
                  </Cell>
                  <Cell>Target &gt;= 70% of JD-critical keywords.</Cell>
                  <Cell>
                    Higher coverage usually leads to better shortlist chances.
                  </Cell>
                </Row>

                {/* Semantic similarity */}
                <Row>
                  <CellHeading>Semantic similarity</CellHeading>
                  <Cell>
                    {semanticPct != null ? `${semanticPct}/100` : "--/100"}
                  </Cell>
                  <Cell>Language overlap with the JD.</Cell>
                  <Cell>
                    Reuse important phrases from the JD where they genuinely fit
                    your experience.
                  </Cell>
                </Row>

                {/* Matched keywords */}
                <Row>
                  <CellHeading>Matched keywords</CellHeading>
                  <Cell colSpan={2}>
                    <KeywordPills data={matchedKw} />
                  </Cell>
                  <Cell>
                    Make sure the most critical JD terms appear naturally in
                    recent roles and skills.
                  </Cell>
                </Row>

                {/* JD keywords missing in resume */}
                <Row>
                  <CellHeading>JD keywords missing in resume</CellHeading>
                  <Cell colSpan={2}>
                    {jdMissingKw.total === 0 ? (
                      <span className="text-gray-500">
                        No obvious JD keywords missing from your resume.
                      </span>
                    ) : (
                      <KeywordPills data={jdMissingKw} />
                    )}
                  </Cell>
                  <Cell>
                    If you actually have experience with these, weave them into
                    bullets and skills.
                  </Cell>
                </Row>

                {/* Resume-only keywords */}
                <Row>
                  <CellHeading>Resume-only keywords</CellHeading>
                  <Cell colSpan={2}>
                    {resumeOnlyKw.total === 0 ? (
                      <span className="text-gray-500">
                        No extra keywords beyond the JD focus.
                      </span>
                    ) : (
                      <KeywordPills data={resumeOnlyKw} />
                    )}
                  </Cell>
                  <Cell>
                    Extra tech is fine, but too much irrelevant stack can dilute
                    your JD alignment.
                  </Cell>
                </Row>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Resume Preview */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-2">Resume Preview</h3>
          {isPdf && pdfUrl ? (
            <div className="border rounded-xl overflow-hidden bg-gray-50">
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-[640px] block"
              >
                <p className="text-sm p-4">
                  PDF preview unavailable. Download and open manually.
                </p>
              </object>
            </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap opacity-90 max-h-[640px] overflow-auto border rounded-xl p-3 bg-gray-50">
              {general?.rawText ||
                "No resume preview available. Upload a PDF resume from the Resume ATS page for a better preview."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------- Small presentational bits ---------------------- */

function Row({ children }) {
  return (
    <tr className="bg-white/80 hover:bg-violet-50/40 transition-colors">
      {children}
    </tr>
  );
}

function CellHeading({ children }) {
  return (
    <td className="align-top py-3 pr-4 text-xs font-semibold text-gray-600">
      {children}
    </td>
  );
}

function Cell({ children, colSpan }) {
  return (
    <td
      className="align-top py-3 px-2 text-xs md:text-sm text-gray-800"
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

function KeywordPills({ data }) {
  const { visible, remaining } = data;

  if (!visible.length) {
    return (
      <span className="text-gray-500">No extracted keywords for this row.</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((kw) => (
        <span
          key={kw}
          className="inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800"
        >
          {kw}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
          +{remaining} more
        </span>
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

ATSMatch.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="resume">
      {page}
    </Layout>
  );
};
