// pages/candidate/ai-mock-interview/result.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

// Small SVG donut for overall score
function ScoreDonut({ value = 0, size = 140 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - 16) / 2; // padding
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-gray-200"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-indigo-500"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="transparent"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-extrabold text-gray-900">
          {Math.round(safe)}%
        </div>
        <div className="text-xs uppercase tracking-wide text-gray-500">
          Overall
        </div>
      </div>
    </div>
  );
}

function ResultMockInterview() {
  const router = useRouter();
  const { interviewId } = router.query;

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/mock-interview/${encodeURIComponent(interviewId)}`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load interview results");
        }

        if (!cancelled) {
          // data.interview is the latest document from mockInterviewAttempts
          setAttempt(data.interview || null);
        }
      } catch (err) {
        console.error("[Result] load error:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load interview results");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  const overallScore = useMemo(
    () => (attempt && typeof attempt.overallScore === "number"
      ? attempt.overallScore
      : 0),
    [attempt]
  );

  // 5 core parameters as stored in DB
  const metricDefs = useMemo(
    () => [
      { key: "appearance", label: "Appearance & Presence" },
      { key: "language", label: "Language & Communication" },
      { key: "confidence", label: "Confidence" },
      { key: "contentDelivery", label: "Content Delivery" },
      { key: "knowledge", label: "Knowledge & Relevance" },
    ],
    []
  );

  const metricsWithValues = useMemo(() => {
    if (!attempt) return [];
    return metricDefs
      .map((m) => ({
        ...m,
        value:
          typeof attempt[m.key] === "number"
            ? Math.max(0, Math.min(100, attempt[m.key]))
            : null,
      }))
      .filter((m) => m.value !== null);
  }, [attempt, metricDefs]);

  const transcript = attempt?.transcript || "";
  const sentimentScore =
    typeof attempt?.sentimentScore === "number"
      ? attempt.sentimentScore
      : null;
  const sentimentSummary =
    attempt?.sentimentSummary || attempt?.emotionalTone || "";
  const eyeContactPercent =
    typeof attempt?.eyeContactPercent === "number"
      ? attempt.eyeContactPercent
      : null;
  const eyeContactLabel = attempt?.eyeContactLabel || "";
  const speakingPace = attempt?.speakingPace || "";
  const fillerUsage = attempt?.fillerUsage || "";
  const fillerCount =
    typeof attempt?.fillerCount === "number" ? attempt.fillerCount : null;
  const wpm = typeof attempt?.wpm === "number" ? attempt.wpm : null;
  const durationSec =
    typeof attempt?.durationSec === "number" ? attempt.durationSec : null;

  // Derive a simple text label from a score
  const scoreBand = (v) => {
    if (v == null) return { label: "No data", color: "bg-gray-100 text-gray-700" };
    if (v >= 80) return { label: "Excellent", color: "bg-emerald-50 text-emerald-700" };
    if (v >= 60) return { label: "Good", color: "bg-sky-50 text-sky-700" };
    if (v >= 40) return { label: "Needs Work", color: "bg-amber-50 text-amber-700" };
    return { label: "Weak", color: "bg-rose-50 text-rose-700" };
  };

  // Auto-generated overall summary & coaching tips based on metrics we have
  const { summaryText, coachingTips } = useMemo(() => {
    if (!attempt) {
      return {
        summaryText:
          "No detailed summary available yet. Try running a fresh interview to get full AI feedback.",
        coachingTips: [],
      };
    }

    const lines = [];
    const tips = [];

    if (overallScore) {
      lines.push(
        `Your overall interview score is ${Math.round(
          overallScore
        )} out of 100 across appearance, communication, confidence, content delivery, and knowledge.`
      );
    }

    if (metricsWithValues.length) {
      const sorted = [...metricsWithValues].sort((a, b) => b.value - a.value);
      const top = sorted[0];
      const second = sorted[1];
      const bottom = sorted[sorted.length - 1];

      if (top) {
        lines.push(
          `Your strongest area was **${top.label}** (${Math.round(
            top.value
          )}%), indicating this is a reliable strength you can highlight in real interviews.`
        );
      }
      if (second) {
        lines.push(
          `You also did well on **${second.label}** (${Math.round(
            second.value
          )}%).`
        );
      }
      if (bottom && bottom.value < 75) {
        lines.push(
          `The biggest opportunity for improvement is **${bottom.label}** (${Math.round(
            bottom.value
          )}%). Focusing on this area will give you the highest ROI.`
        );
      }
    }

    if (sentimentSummary) {
      lines.push(sentimentSummary);
    }

    // Coaching tips from metrics
    if (speakingPace === "fast") {
      tips.push(
        "Your speaking pace was detected as *fast*. Pause between ideas and slow slightly so that complex points land clearly."
      );
    } else if (speakingPace === "slow") {
      tips.push(
        "Your speaking pace was classified as *slow*. Try adding a bit more energy and vary your tone to keep the interviewer engaged."
      );
    }

    if (fillerUsage === "high") {
      tips.push(
        "You used a high number of filler words (um, uh, like). Practice answering common questions while consciously pausing instead of using fillers."
      );
    } else if (fillerUsage === "medium") {
      tips.push(
        "Filler-word usage is moderate. You’re close to polished — aim for slightly cleaner sentences by pausing briefly before you answer."
      );
    }

    if (eyeContactPercent != null) {
      if (eyeContactPercent >= 70) {
        tips.push(
          "Eye contact stability is strong. Keep maintaining that camera focus — it builds trust and presence."
        );
      } else if (eyeContactPercent >= 40) {
        tips.push(
          "Eye contact was somewhat variable. When answering, try to look at the camera a bit more consistently to project confidence."
        );
      } else {
        tips.push(
          "Eye contact was low. In a real interview, practice looking at the camera as if it’s the interviewer’s eyes for most of your answer."
        );
      }
    }

    if (overallScore && overallScore < 70) {
      tips.push(
        "Before each interview, write down 2–3 structured stories (Situation–Task–Action–Result) you can adapt to different questions. This will instantly improve clarity and confidence."
      );
    }

    if (!tips.length) {
      tips.push(
        "You’re on a solid track. Keep practising with a few more mock sessions to see how your scores trend over time."
      );
    }

    return {
      summaryText: lines.join("\n\n") || "",
      coachingTips: tips,
    };
  }, [
    attempt,
    overallScore,
    metricsWithValues,
    sentimentSummary,
    speakingPace,
    fillerUsage,
    eyeContactPercent,
  ]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Mock Interview – Results
          </h1>
          <p className="text-gray-600 mt-1">
            Here’s your AI-generated feedback based on your recorded interview.
          </p>
          {durationSec ? (
            <p className="text-xs text-gray-500 mt-1">
              Session length: ~{Math.max(1, Math.round(durationSec / 60))} min •{" "}
              {wpm != null ? `${wpm} words / minute` : "WPM unavailable"}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4">
            <ScoreDonut value={overallScore} />
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Overall Score
              </div>
              <div className="text-sm text-gray-600">
                {overallScore
                  ? "Higher scores indicate you’re closer to real interview readiness."
                  : "Record a longer answer to unlock richer feedback."}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Loading / error states */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-600 font-medium">
            Analyzing your interview… please wait.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm shadow-sm">
          {error}
        </div>
      )}

      {/* Main content */}
      {attempt && !loading && (
        <>
          {/* Metrics row */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {metricsWithValues.map((m) => {
              const band = scoreBand(m.value);
              return (
                <div
                  key={m.key}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {m.label}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${band.color}`}
                    >
                      {band.label}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-1">
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.round(m.value)}%
                    </div>
                    <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${Math.min(Math.max(m.value, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Summary + Coaching + Sentiment */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Overall summary */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Overall Summary
              </h2>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {summaryText ||
                  "No detailed summary available. Try recording again for full AI feedback."}
              </p>
            </div>

            {/* Communication / sentiment insights */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Communication & Sentiment
              </h2>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Sentiment
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {sentimentScore != null ? `${Math.round(sentimentScore)}%` : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {sentimentSummary || "Overall emotional tone not available."}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Eye Contact
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {eyeContactPercent != null
                      ? `${Math.round(eyeContactPercent)}%`
                      : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">
                    {eyeContactLabel || "Eye contact data not available."}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Speaking Pace
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900 capitalize">
                    {speakingPace || "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {wpm != null ? `${wpm} words / minute` : "WPM not captured."}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Filler Words
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900 capitalize">
                    {fillerUsage || "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {fillerCount != null
                      ? `${fillerCount} estimated fillers`
                      : "Count not available."}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Coaching tips */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              AI Coaching Tips
            </h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {coachingTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </section>

          {/* Transcript */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Transcript
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-line max-h-[320px] overflow-auto leading-relaxed">
              {transcript || "Transcript unavailable for this attempt."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

ResultMockInterview.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="ai-mock">
      {page}
    </Layout>
  );
};

export default ResultMockInterview;
