// pages/candidate/aptitude/[applicationId]/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../../components/Layout";

function AptitudeInstructions() {
  const router = useRouter();
  const { applicationId } = router.query;

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!applicationId) return;

    let cancelled = false;

    const fetchMeta = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/aptitude/test?applicationId=${applicationId}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load aptitude test");
        }

        const data = await res.json();
        if (!cancelled) {
          setMeta(data);
        }
      } catch (e) {
        console.error("Aptitude instructions load error:", e);
        if (!cancelled) setError(e.message || "Failed to load test");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMeta();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const handleBegin = () => {
    if (!applicationId) return;
    router.push(`/candidate/aptitude/${applicationId}/live`);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Aptitude Test – Round 2
        </h1>
        <p className="text-gray-600 mb-6">
          This is your official aptitude assessment for the shortlisted job.
          Please read the instructions carefully before you begin.
        </p>

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-gray-500">Loading test details...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-4">
            <p className="font-semibold">Unable to start test</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && meta && (
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <div className="mb-6">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                Job
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {meta.job?.title}
              </h2>
              <p className="text-gray-600 mt-1">{meta.job?.company}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-indigo-50 rounded-xl p-5">
                <h3 className="font-semibold text-indigo-900 mb-3">
                  Test Overview
                </h3>
                <ul className="space-y-2 text-sm text-indigo-900">
                  <li>• Timed aptitude assessment for this specific job.</li>
                  <li>
                    • Duration:{" "}
                    <span className="font-semibold">
                      {meta.test?.durationMinutes || 60} minutes
                    </span>
                  </li>
                  <li>
                    • Questions:{" "}
                    <span className="font-semibold">
                      {meta.test?.questions?.length || 0} MCQs
                    </span>
                  </li>
                  <li>• Your score will be shared with the recruiter.</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-xl p-5">
                <h3 className="font-semibold text-purple-900 mb-3">
                  Proctoring & Rules
                </h3>
                <ul className="space-y-2 text-sm text-purple-900">
                  <li>• Camera-based monitoring with basic AI proctoring.</li>
                  <li>• Avoid switching tabs or minimizing the window.</li>
                  <li>
                    • Excessive violations (no face / looking away) may auto-submit
                    your test.
                  </li>
                  <li>• Do not refresh or close the tab during the test.</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900 mb-6">
              <p className="font-semibold mb-1">Note</p>
              <p>
                Your camera will be used during the exam only for proctoring.
                Streams are used in real time and are stopped automatically
                when the test is submitted or time runs out.
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                When you click &quot;Begin Test&quot;, the timer will start.
              </p>
              <button
                onClick={handleBegin}
                disabled={!applicationId || !!error}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Begin Test →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AptitudeInstructions;
