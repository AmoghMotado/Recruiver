// pages/candidate/mock-test-result.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function MockTestResult() {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [tips, setTips] = useState([]);

  useEffect(() => {
    // Load score & summary from localStorage
    let rawScore = 0;
    try {
      rawScore = parseInt(localStorage.getItem("mockTest.score") || "0", 10);
    } catch {
      rawScore = 0;
    }
    setScore(Number.isNaN(rawScore) ? 0 : rawScore);

    let sum = null;
    try {
      sum = JSON.parse(localStorage.getItem("mockTest.summary") || "null");
    } catch {
      sum = null;
    }
    setSummary(sum);

    // Generate AI-style tips (mocked on frontend)
    const timer = setTimeout(() => {
      const byCategory = sum && sum.byCategory ? sum.byCategory : {};
      const catNames = {
        quant: "Quantitative Aptitude",
        logical: "Logical Reasoning",
        verbal: "Verbal / Communication",
      };

      // Determine weakest category (lowest accuracy)
      let weakestKey = null;
      let weakestAcc = Infinity;
      ["quant", "logical", "verbal"].forEach((k) => {
        const c = byCategory[k];
        if (c && c.total > 0) {
          const acc = c.correct / c.total;
          if (acc < weakestAcc) {
            weakestAcc = acc;
            weakestKey = k;
          }
        }
      });

      const weakestName = weakestKey ? catNames[weakestKey] : "overall aptitude";

      const baseTips = [
        `Focus more on ${weakestName}; revisit basic concepts and solve targeted questions in that section.`,
        "Recheck your approach on questions where you were unsure instead of skipping immediately.",
        "Spend time analysing each mistake after the test—understand why the correct option is right.",
        "Simulate real exam conditions regularly to improve both speed and accuracy.",
        "For Quant, practice mental calculations and percentage / ratio based problems.",
        "For Logical Reasoning, draw quick diagrams / tables to structure the information given.",
        "For Verbal, read short articles daily and summarise them in your own words.",
      ];

      const chosen = [
        baseTips[0],
        weakestKey === "quant"
          ? baseTips[4]
          : weakestKey === "logical"
          ? baseTips[5]
          : baseTips[6],
        baseTips[1],
        baseTips[2],
      ];

      setTips(chosen);
      setGenerating(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const ring = useMemo(() => {
    const radius = 70;
    const stroke = 14;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const pct = Math.max(0, Math.min(100, score));
    const dash = (pct / 100) * circumference;
    return { normalizedRadius, stroke, circumference, dash, pct };
  }, [score]);

  const getPerformanceLevel = (s) => {
    if (s >= 80) return { label: "Excellent", color: "emerald", emoji: "🌟" };
    if (s >= 60) return { label: "Good", color: "blue", emoji: "👍" };
    if (s >= 40) return { label: "Average", color: "amber", emoji: "📈" };
    return { label: "Needs Improvement", color: "red", emoji: "💪" };
  };

  const performance = getPerformanceLevel(score);
  const colorClasses = {
    emerald: "from-emerald-600 to-emerald-700",
    blue: "from-blue-600 to-blue-700",
    amber: "from-amber-600 to-amber-700",
    red: "from-red-600 to-red-700",
  };

  // 🔁 Clean RETAKE: wipe all mockTest.* keys and go back to intro
  const handleRetake = () => {
    try {
      const keys = Object.keys(localStorage);
      keys
        .filter((k) => k.startsWith("mockTest."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    router.push("/candidate/mock-test");
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Test Complete!</h1>
        <p className="text-lg text-gray-600 mt-3">
          Here&apos;s your performance summary for the proctored mock test.
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Card */}
        <div
          className={`bg-gradient-to-br ${
            colorClasses[performance.color]
          } rounded-xl border border-gray-200 p-12 text-white`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">{performance.emoji}</div>
            <div className="text-7xl font-bold mb-2">{score}%</div>
            <div className="text-2xl font-semibold mb-8 opacity-90">
              {performance.label}
            </div>

            <svg width="200" height="200" className="mx-auto mb-8">
              <circle
                stroke="rgba(255,255,255,0.2)"
                fill="transparent"
                strokeWidth={ring.stroke}
                r={ring.normalizedRadius}
                cx="100"
                cy="100"
              />
              <circle
                stroke="rgba(255,255,255,0.6)"
                fill="transparent"
                strokeLinecap="round"
                strokeWidth={ring.stroke}
                strokeDasharray={`${ring.dash} ${
                  ring.circumference - ring.dash
                }`}
                r={ring.normalizedRadius}
                cx="100"
                cy="100"
                style={{ transition: "stroke-dasharray .8s ease" }}
              />
            </svg>

            {summary && (
              <div className="space-y-2 text-base">
                <div>
                  <span className="opacity-90">Correct Answers:</span>
                  <span className="font-bold">
                    {" "}
                    {summary.correct}/{summary.total}
                  </span>
                </div>
                <div className="opacity-80 text-sm">
                  Attempted: {summary.attempted} • Skipped: {summary.skipped}
                  {summary.autoSubmitted && " • (Auto-submitted)"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            💡 AI-Style Improvement Tips
          </h2>

          {generating ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full" />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Analyzing your performance…
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">
                    {i === 0
                      ? "1️⃣"
                      : i === 1
                      ? "2️⃣"
                      : i === 2
                      ? "3️⃣"
                      : "4️⃣"}
                  </span>
                  <span className="text-base text-gray-700 leading-relaxed">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📊 Performance Breakdown
        </h2>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
              <div className="text-4xl font-bold text-emerald-900">
                {summary.correct}
              </div>
              <div className="text-sm text-emerald-700 font-semibold mt-2">
                Correct
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <div className="text-4xl font-bold text-red-900">
                {summary.total - summary.correct}
              </div>
              <div className="text-sm text-red-700 font-semibold mt-2">
                Incorrect
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-4xl font-bold text-blue-900">
                {summary.attempted}
              </div>
              <div className="text-sm text-blue-700 font-semibold mt-2">
                Attempted
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-4xl font-bold text-orange-900">
                {summary.skipped}
              </div>
              <div className="text-sm text-orange-700 font-semibold mt-2">
                Skipped
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={handleRetake}
          className="px-8 py-3 rounded-lg font-bold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
        >
          🔄 Retake Test
        </button>
        <Link
          href="/candidate/dashboard"
          className="px-8 py-3 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-lg transition-all"
        >
          → Go to Dashboard
        </Link>
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