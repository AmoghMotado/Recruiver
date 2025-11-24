// pages/candidate/video-interview/start.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

const STORAGE_KEY = "videoInterview";

function VideoInterviewStart() {
  const router = useRouter();
  const { applicationId } = router.query;

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const url = `/api/interview/test?applicationId=${encodeURIComponent(
          String(applicationId)
        )}`;

        console.log("[VideoInterviewStart] loading from", url);

        const res = await fetch(url, { credentials: "include" });
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        if (!res.ok) {
          // If auth expired, send them back to login (like other pages)
          if (res.status === 401) {
            if (!cancelled) {
              alert("Not authenticated. Please log in again.");
              if (typeof window !== "undefined") {
                window.location.href = "/login?role=candidate";
              }
            }
            return;
          }

          console.error(
            "[VideoInterviewStart] HTTP error",
            res.status,
            data
          );
          throw new Error(
            data.message || "Failed to load video interview details"
          );
        }

        if (cancelled) return;

        setMeta(data.meta || null);
        setQuestions(data.questions || []);

        // cache for live.js
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            `${STORAGE_KEY}.questions`,
            JSON.stringify(data.questions || [])
          );
          window.localStorage.setItem(
            `${STORAGE_KEY}.meta`,
            JSON.stringify(data.meta || null)
          );
          window.localStorage.setItem(
            `${STORAGE_KEY}.applicationId`,
            String(applicationId)
          );
        }
      } catch (e) {
        console.error("Video interview meta error:", e);
        if (!cancelled) {
          setError(
            e?.message || "Failed to load video interview details"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const handleBegin = () => {
    if (!applicationId) return;
    router.push(
      `/candidate/video-interview/live?applicationId=${encodeURIComponent(
        String(applicationId)
      )}`
    );
  };

  return (
    <Layout role="CANDIDATE" active="job-profiles">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
            Round 2 · AI Video Interview
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            One-Way AI Video Interview
          </h1>
          <p className="text-gray-600 mb-6">
            In this round you&apos;ll record short video answers to a set of
            questions. Your responses will be automatically analyzed and shared
            with the recruiter.
          </p>

          {loading && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                Loading interview details…
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="font-semibold text-red-800">
                Unable to start interview
              </p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && meta && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-indigo-50 rounded-xl p-5">
                  <h2 className="font-semibold text-indigo-900 mb-2">
                    Role details
                  </h2>
                  <p className="text-sm text-indigo-900">
                    <span className="font-semibold">{meta.title}</span>
                    {meta.company ? ` · ${meta.company}` : ""}
                  </p>
                  <ul className="mt-3 text-sm text-indigo-900 space-y-1">
                    <li>
                      • Approx duration:{" "}
                      <span className="font-semibold">
                        {meta.durationMinutes || 15} minutes
                      </span>
                    </li>
                    <li>
                      • Questions:{" "}
                      <span className="font-semibold">
                        {questions.length || 0}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-xl p-5">
                  <h2 className="font-semibold text-purple-900 mb-2">
                    Interview rules
                  </h2>
                  <ul className="text-sm text-purple-900 space-y-1">
                    <li>• Your camera and microphone will be required.</li>
                    <li>• You can move between questions while recording.</li>
                    <li>• Do not refresh or close the tab while answering.</li>
                    <li>• Click “Stop &amp; Submit” only when you&apos;re done.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900 mb-6">
                <p className="font-semibold mb-1">Privacy</p>
                <p>
                  Your interview video is used only for recruitment for this
                  specific job and may be reviewed by the recruiter and their
                  hiring team.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  When you click{" "}
                  <span className="font-semibold">“Begin Interview”</span>, your
                  camera preview will open and the timer will start.
                </p>
                <button
                  disabled={!applicationId || !!error}
                  onClick={handleBegin}
                  className="px-6 py-3 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-60"
                >
                  Begin Interview →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default VideoInterviewStart;
