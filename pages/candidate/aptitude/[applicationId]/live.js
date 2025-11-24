// pages/candidate/aptitude/[applicationId]/live.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../../components/Layout";
import ProctoringCamera from "../../../../components/proctoring/ProctoringCamera";

const STATUS = {
  UNVISITED: "unvisited",
  VISITED: "visited",
  ATTEMPTED: "attempted",
  SKIPPED: "skipped",
};

const MAX_VIOLATIONS = 5;
const STORAGE_KEY = "aptitudeTest";
const STORAGE_RESULT_KEY = "aptitudeTest:result";

function toSafeJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function AptitudeLiveInner() {
  const router = useRouter();
  const { applicationId } = router.query;
  const hasSubmittedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(3600);
  const [violations, setViolations] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [jobMeta, setJobMeta] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     Load live questions from server
     ========================================================= */
  useEffect(() => {
    if (!applicationId) return;

    const load = async () => {
      setLoading(true);

      try {
        // Always clear stale LS for safety
        localStorage.removeItem(`${STORAGE_KEY}.questions`);

        const res = await fetch(
          `/api/aptitude/test?applicationId=${encodeURIComponent(
            applicationId
          )}`,
          { credentials: "include" }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load aptitude test");
        }

        const qs = data.questions || [];
        const meta = data.meta || null;

        setQuestions(qs);
        setJobMeta(meta);

        /* --------------------------------------------
           RESTORE PROGRESS SAFELY
           -------------------------------------------- */

        const defaultTime =
          meta?.durationMinutes && meta.durationMinutes > 0
            ? meta.durationMinutes * 60
            : 60 * 60;

        // Restore time safely
        let storedTime = parseInt(
          localStorage.getItem(`${STORAGE_KEY}.timeLeft`) || "",
          10
        );

        if (
          Number.isNaN(storedTime) ||
          storedTime <= 0 ||
          storedTime > defaultTime
        ) {
          storedTime = defaultTime;
        }

        // Restore violations safely
        let storedViolations = toSafeJSON(
          localStorage.getItem(`${STORAGE_KEY}.violations`) || "[]",
          []
        );

        if (!Array.isArray(storedViolations)) storedViolations = [];

        if (storedViolations.length >= MAX_VIOLATIONS) {
          storedViolations = [];
        }

        const storedAns = toSafeJSON(
          localStorage.getItem(`${STORAGE_KEY}.answers`) || "{}",
          {}
        );

        const storedStatus = toSafeJSON(
          localStorage.getItem(`${STORAGE_KEY}.status`) || "[]",
          []
        );

        setAnswers(storedAns || {});

        if (Array.isArray(storedStatus) && storedStatus.length === qs.length) {
          setStatus(storedStatus);
        } else {
          setStatus(Array(qs.length).fill(STATUS.UNVISITED));
        }

        setSecondsLeft(storedTime);
        setViolations(storedViolations);
        setViolationCount(storedViolations.length);
      } catch (err) {
        alert(err.message || "Failed to load test");
        setQuestions([]);
        setStatus([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [applicationId]);

  /* =========================================================
     Countdown timer (safe)
     ========================================================= */
  useEffect(() => {
    if (!questions.length) return;

    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          if (!hasSubmittedRef.current) handleSubmit(true, "TIME_UP");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [questions.length]);

  // Persist time
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}.timeLeft`, String(secondsLeft));
    } catch {}
  }, [secondsLeft]);

  /* =========================================================
     Proctoring
     ========================================================= */
  const registerViolation = (source, reason) => {
    setViolations((prev) => {
      const updated = [...prev, { ts: Date.now(), source, reason }];
      try {
        localStorage.setItem(
          `${STORAGE_KEY}.violations`,
          JSON.stringify(updated)
        );
      } catch {}
      return updated;
    });
    setViolationCount((prev) => prev + 1);
  };

  // Visibility & blur
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        registerViolation("tab", "Tab hidden / switched away");
      }
    };
    const handleBlur = () => {
      registerViolation("tab", "Window blur (possible tab switch)");
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Auto-submit on max violations (safe)
  useEffect(() => {
    if (
      violationCount >= MAX_VIOLATIONS &&
      !hasSubmittedRef.current &&
      questions.length > 0
    ) {
      handleSubmit(true, "VIOLATION_LIMIT");
    }
  }, [violationCount, questions.length]);

  /* ========================================================= */

  const question = useMemo(
    () => (questions.length ? questions[idx] : null),
    [questions, idx]
  );

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  const updateStatus = (qIdx, newState) => {
    setStatus((prev) => {
      const copy = [...prev];
      if (copy[qIdx] !== STATUS.ATTEMPTED || newState === STATUS.ATTEMPTED) {
        copy[qIdx] = newState;
      }
      try {
        localStorage.setItem(`${STORAGE_KEY}.status`, JSON.stringify(copy));
      } catch {}
      return copy;
    });
  };

  const selectOption = (optIndex) => {
    if (!question) return;
    const newAns = { ...answers, [question.id]: optIndex };
    setAnswers(newAns);

    try {
      localStorage.setItem(`${STORAGE_KEY}.answers`, JSON.stringify(newAns));
    } catch {}

    updateStatus(idx, STATUS.ATTEMPTED);
  };

  const goNext = () => {
    if (!questions.length) return;
    const next = Math.min(idx + 1, questions.length - 1);
    if (next !== idx) {
      updateStatus(next, STATUS.VISITED);
      setIdx(next);
    }
  };

  const goPrev = () => {
    const prev = Math.max(idx - 1, 0);
    if (prev !== idx) {
      updateStatus(prev, STATUS.VISITED);
      setIdx(prev);
    }
  };

  const skip = () => {
    updateStatus(idx, STATUS.SKIPPED);
    goNext();
  };

  /* =========================================================
     Submit
     ========================================================= */
  const handleSubmit = async (auto = false, autoReason = null) => {
    if (!questions.length || !applicationId) return;
    if (hasSubmittedRef.current) return;

    hasSubmittedRef.current = true;
    setSubmitting(true);

    const totalQuestions = questions.length;
    const attempted = Object.keys(answers).length;
    const skipped = status.filter((s) => s === STATUS.SKIPPED).length;

    const endReason =
      autoReason === "TIME_UP"
        ? "TIME_UP"
        : autoReason === "VIOLATION_LIMIT"
        ? "VIOLATION_LIMIT"
        : "MANUAL";

    try {
      const payload = {
        applicationId,
        answers: Object.entries(answers).map(([questionId, optionIndex]) => ({
          questionId,
          optionIndex,
        })),
        proctoring: {
          totalViolations: violations.length,
          autoSubmitted: autoReason === "VIOLATION_LIMIT",
        },
        endReason,
      };

      const res = await fetch("/api/aptitude/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit aptitude test");
      }

      const finalScore = typeof data.score === "number" ? data.score : 0;
      const summary = data.summary || {};

      const resultPayload = {
        applicationId,
        score: finalScore,
        totalQuestions: summary.totalQuestions ?? totalQuestions,
        correct: summary.correct ?? 0,
        incorrect: summary.incorrect ?? 0,
        attempted: summary.attempted ?? attempted,
        skipped: summary.skipped ?? skipped,
        violationCount: violations.length,
        endReason,
      };

      // Save result to LS
      try {
        localStorage.setItem(
          STORAGE_RESULT_KEY,
          JSON.stringify(resultPayload)
        );
        localStorage.setItem(
          `${STORAGE_KEY}.summary`,
          JSON.stringify(summary)
        );

        // 🔥 IMPORTANT: Clear all old progress
        localStorage.removeItem(`${STORAGE_KEY}.timeLeft`);
        localStorage.removeItem(`${STORAGE_KEY}.answers`);
        localStorage.removeItem(`${STORAGE_KEY}.status`);
        localStorage.removeItem(`${STORAGE_KEY}.violations`);
      } catch {}
    } catch (err) {
      alert(err.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
      router.replace(
        `/candidate/aptitude/${encodeURIComponent(
          applicationId
        )}/result`
      );
    }
  };

  /* =========================================================
     Initial VISITED mark
     ========================================================= */
  useEffect(() => {
    if (
      questions.length &&
      status.length === questions.length &&
      status[0] === STATUS.UNVISITED
    ) {
      updateStatus(0, STATUS.VISITED);
    }
  }, [questions.length, status.length]);

  /* ========================================================= */

  if (loading || !question) {
    return (
      <Layout role="CANDIDATE" active="job-profiles">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-lg text-gray-600 font-medium">
            Loading aptitude test…
          </p>
        </div>
      </Layout>
    );
  }

  const selected = answers[question.id];

  /* =========================================================
     UI
     ========================================================= */
  return (
    <Layout role="CANDIDATE" active="job-profiles">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Round 2 – Aptitude Test
            </h2>
            {jobMeta && (
              <p className="text-sm text-gray-600 mt-1">
                Job:{" "}
                <span className="font-semibold">
                  {jobMeta.title} · {jobMeta.company}
                </span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              Questions:{" "}
              <span className="font-semibold">{questions.length}</span> |
              Time:{" "}
              <span className="font-semibold">
                {jobMeta?.durationMinutes || 60} minutes
              </span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
            <div className="text-right">
              <div
                className={`text-2xl font-bold font-mono ${
                  secondsLeft < 60 ? "text-red-600" : "text-indigo-600"
                }`}
              >
                {mmss}
              </div>
              <div className="text-xs text-gray-500">
                Violations:{" "}
                <span
                  className={
                    violationCount > 0
                      ? "text-red-600 font-semibold"
                      : "font-semibold"
                  }
                >
                  {violationCount}/{MAX_VIOLATIONS}
                </span>
              </div>
            </div>

            <ProctoringCamera
              maxViolations={MAX_VIOLATIONS}
              onViolation={({ reason, type }) =>
                registerViolation(type || "camera", reason)
              }
            />
          </div>
        </div>

        {violationCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-900">
              ⚠️ <strong>Proctoring Notice:</strong> We detected{" "}
              <span className="font-semibold">{violationCount}</span>{" "}
              violation{violationCount > 1 ? "s" : ""}. Repeated violations may
              auto-submit your test.
            </p>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Question {idx + 1} of {questions.length}
              </h2>
              <p className="text-base text-gray-600 mt-3">{question.text}</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="space-y-3 mb-8">
            {question.options.map((opt, i) => {
              const active = i === selected;
              return (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all font-semibold text-lg ${
                    active
                      ? "bg-indigo-50 border-indigo-400 text-indigo-900"
                      : "bg-gray-50 border-gray-200 text-gray-900 hover:border-indigo-200"
                  }`}
                >
                  <span className="inline-block w-8 h-8 rounded-full mr-4 text-center font-bold text-base">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-between">
            <button
              onClick={goPrev}
              disabled={idx === 0}
              className="px-6 py-3 rounded-lg font-bold border-2 border-gray-300 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={skip}
                className="px-6 py-3 rounded-lg font-bold border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                ⊘ Skip
              </button>

              {idx < questions.length - 1 ? (
                <button
                  onClick={goNext}
                  className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-lg"
                >
                  Next →
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={() => handleSubmit(false, "MANUAL_SUBMIT")}
                  className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "✓ Submit"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function AptitudeLive(pageProps) {
  return <AptitudeLiveInner {...pageProps} />;
}
