import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function MockTestResult() {
  const [score, setScore] = useState(0);
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [tips, setTips] = useState([]);

  useEffect(() => {
    const s = parseInt(localStorage.getItem("mockTest.score") || "0", 10);
    setScore(Number.isNaN(s) ? 0 : s);
    try {
      const sum = JSON.parse(localStorage.getItem("mockTest.summary") || "null");
      setSummary(sum);
    } catch {}
    const t = setTimeout(() => {
      const pool = [
        "Focus more on quantitative reasoning.",
        "Improve accuracy in logical questions.",
        "Your speed was above average—keep it up.",
        "Revise permutations & combinations basics.",
        "Practice data interpretation sets daily.",
        "Work on time–distance and ratio problems.",
      ];
      const selected = [
        pool[0],
        pool[1],
        s >= 70 ? pool[2] : pool[3],
        s >= 50 ? pool[4] : pool[5],
      ];
      setTips(selected);
      setGenerating(false);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  const ring = useMemo(() => {
    const radius = 62;
    const stroke = 12;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const pct = Math.max(0, Math.min(100, score));
    const dash = (pct / 100) * circumference;
    return { normalizedRadius, stroke, circumference, dash, pct };
  }, [score]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
      <div className="card flex flex-col items-center gap-3">
        <svg width="180" height="180" className="block">
          <defs>
            <linearGradient id="resultGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(99,102,241,1)" />
              <stop offset="100%" stopColor="rgba(16,185,129,1)" />
            </linearGradient>
          </defs>
          <circle
            stroke="rgba(255,255,255,0.15)"
            fill="transparent"
            strokeWidth={ring.stroke}
            r={ring.normalizedRadius}
            cx="90"
            cy="90"
          />
          <circle
            stroke="url(#resultGrad)"
            fill="transparent"
            strokeLinecap="round"
            strokeWidth={ring.stroke}
            strokeDasharray={`${ring.dash} ${ring.circumference - ring.dash}`}
            r={ring.normalizedRadius}
            cx="90"
            cy="90"
            style={{ transition: "stroke-dasharray .8s ease" }}
          />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="30" fontWeight="700">
            {ring.pct}%
          </text>
        </svg>
        <div className="text-sm opacity-80">
          {summary ? (
            <>
              <div>
                Correct: <span className="font-semibold">{summary.correct}</span> / {summary.total}
              </div>
              <div className="opacity-70">
                Attempted: {summary.attempted} &middot; Skipped: {summary.skipped}{" "}
                {summary.autoSubmitted ? "· (Auto-submitted)" : ""}
              </div>
            </>
          ) : (
            <div className="opacity-70">Summary unavailable</div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Link href="/candidate/mock-test" className="btn outline">
            Retake Test
          </Link>
          <Link href="/candidate/dashboard" className="btn primary">
            Go to Dashboard
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-2">AI Tips</h3>

        {generating ? (
          <div className="space-y-3">
            <div className="ai-loader">
              <div className="line" />
              <div className="line" />
              <div className="line" />
            </div>
            <div className="text-sm opacity-80">Generating AI tips…</div>
            <style jsx>{`
              .ai-loader .line {
                height: 10px;
                border-radius: 999px;
                background: linear-gradient(90deg, rgba(99,102,241,.2), rgba(16,185,129,.9), rgba(99,102,241,.2));
                background-size: 200% 100%;
                animation: flow 1.1s linear infinite;
                margin-top: 10px;
              }
              @keyframes flow {
                0% { background-position: 200% 0; }
                100% { background-position: 0% 0; }
              }
            `}</style>
          </div>
        ) : (
          <ul className="list-disc pl-5 space-y-2 text-sm">
            {tips.map((t, i) => (
              <li key={i} className="opacity-90">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

MockTestResult.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="mock-test">
      {page}
    </Layout>
  );
};
