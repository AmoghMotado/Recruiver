// pages/candidate/aptitude/[applicationId]/result.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../../components/Layout";

const STORAGE_RESULT_KEY = "aptitudeTest:result";

function AptitudeResult() {
  const router = useRouter();
  const { applicationId } = router.query;

  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!applicationId || typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_RESULT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.applicationId === applicationId) {
        setResult(parsed);
      }
    } catch (e) {
      console.warn("Failed to read aptitude result from storage", e);
    }
  }, [applicationId]);

  const handleBack = () => {
    router.push("/candidate/job-profiles?tab=applications");
  };

  if (!result) {
    return (
      <Layout role="CANDIDATE">
        <div className="max-w-4xl mx-auto py-10 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aptitude Test Result
            </h1>
            <p className="text-gray-600 mb-4">
              We could not find your local test summary, but your score has been
              submitted to the recruiter.
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700"
            >
              Back to My Applications
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const {
    score = 0,
    totalQuestions = 0,
    correct = 0,
    incorrect = 0,
    attempted = 0,
    skipped = 0,
    violationCount = 0,
    endReason = "COMPLETED",
  } = result;

  const endReasonLabel =
    endReason === "TIME_UP"
      ? "Time up"
      : endReason === "VIOLATION_LIMIT"
      ? "Auto-submitted (violation limit reached)"
      : endReason === "MANUAL"
      ? "Manually submitted"
      : endReason;

  return (
    <Layout role="CANDIDATE">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Aptitude Test Result
          </h1>
          <p className="text-gray-600 mb-4">
            Your Round 2 aptitude test has been submitted. The recruiter will
            review your score and decide the next steps.
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Overall Score</p>
              <p className="text-5xl font-extrabold text-indigo-600">
                {score} <span className="text-2xl text-gray-400">/ 100</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-emerald-50 rounded-xl px-4 py-3">
                <p className="text-emerald-800 font-semibold">
                  Correct: {correct}
                </p>
                <p className="text-emerald-700 text-xs">
                  Out of {totalQuestions} questions
                </p>
              </div>
              <div className="bg-rose-50 rounded-xl px-4 py-3">
                <p className="text-rose-800 font-semibold">
                  Incorrect: {incorrect}
                </p>
                <p className="text-rose-700 text-xs">Attempted but wrong</p>
              </div>
              <div className="bg-indigo-50 rounded-xl px-4 py-3">
                <p className="text-indigo-800 font-semibold">
                  Attempted: {attempted}
                </p>
                <p className="text-indigo-700 text-xs">
                  Skipped: {skipped || 0}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-xl px-4 py-3">
                <p className="text-yellow-800 font-semibold">
                  Violations: {violationCount || 0}
                </p>
                <p className="text-yellow-700 text-xs">
                  Reason: {endReasonLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              You will see an update in your application status once the
              recruiter reviews your performance.
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700"
            >
              Back to My Applications
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AptitudeResult;
