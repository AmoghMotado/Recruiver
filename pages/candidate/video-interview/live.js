// pages/candidate/video-interview/live.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

const STORAGE_KEY = "videoInterview";

function VideoInterviewLive() {
  const router = useRouter();
  const { applicationId: queryApplicationId } = router.query;

  const [applicationId, setApplicationId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Media refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Load questions/meta (prefer localStorage from /start, fallback to API)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!router.isReady) return;

    let appId = typeof queryApplicationId === "string" ? queryApplicationId : "";
    if (!appId && typeof window !== "undefined") {
      const stored = window.localStorage.getItem(`${STORAGE_KEY}.applicationId`);
      if (stored) appId = stored;
    }

    if (!appId) {
      setError("Missing application reference. Please start from My Applications.");
      setLoading(false);
      return;
    }
    setApplicationId(appId);

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        let localQs = null;
        let localMeta = null;

        if (typeof window !== "undefined") {
          try {
            const qStr = window.localStorage.getItem(
              `${STORAGE_KEY}.questions`
            );
            const mStr = window.localStorage.getItem(`${STORAGE_KEY}.meta`);
            if (qStr) localQs = JSON.parse(qStr);
            if (mStr) localMeta = JSON.parse(mStr);
          } catch {
            // ignore parse errors, just refetch
          }
        }

        if (localQs && Array.isArray(localQs) && localMeta) {
          setQuestions(localQs);
          setMeta(localMeta);
          setLoading(false);
          return;
        }

        // Fallback: fetch again
        const res = await fetch(
          `/api/interview/test?applicationId=${encodeURIComponent(appId)}`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load video interview");
        }

        setQuestions(data.questions || []);
        setMeta(data.meta || null);

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
            String(appId)
          );
        }
      } catch (e) {
        console.error("[VideoInterviewLive] load error:", e);
        setError(e.message || "Failed to load interview details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router.isReady, queryApplicationId]);

  // ---------------------------------------------------------------------------
  // Camera setup
  // ---------------------------------------------------------------------------
  const ensureStream = async () => {
    if (streamRef.current) return streamRef.current;

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Camera not supported in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return stream;
  };

  useEffect(() => {
    // Attach existing stream to video element if page re-renders
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }

    // Cleanup on unmount
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Recording controls
  // ---------------------------------------------------------------------------
  const handleStart = async () => {
    try {
      if (isRecording) return;
      const stream = await ensureStream();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error", e);
        alert("Recording error. Please refresh the page and try again.");
      };

      recorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setHasStarted(true);
      setIsRecording(true);
    } catch (e) {
      console.error("handleStart error:", e);
      alert(e.message || "Failed to start recording");
    }
  };

  const handleNextQuestion = () => {
    if (!hasStarted) return;
    setCurrentIndex((prev) =>
      prev < questions.length - 1 ? prev + 1 : prev
    );
  };

  const handleStopAndSubmit = async () => {
    if (!recorderRef.current) {
      alert("Recording not started yet.");
      return;
    }
    if (!applicationId) {
      alert("Missing application reference.");
      return;
    }

    setIsSubmitting(true);
    setIsRecording(false);

    try {
      const blob = await new Promise((resolve, reject) => {
        const recorder = recorderRef.current;
        const localChunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            localChunks.push(e.data);
          }
        };

        recorder.onerror = (e) => {
          reject(e.error || new Error("Recording error"));
        };

        recorder.onstop = () => {
          resolve(
            new Blob(localChunks, {
              type: "video/webm",
            })
          );
        };

        if (recorder.state !== "inactive") {
          recorder.stop();
        } else {
          // Already stopped — just resolve empty
          resolve(
            new Blob([], {
              type: "video/webm",
            })
          );
        }
      });

      // Build minimal answers mapping (no transcripts yet)
      const answersJson = JSON.stringify(
        questions.map((q, idx) => ({
          questionId: q.id,
          questionText: q.text,
          index: idx,
        }))
      );

      const fd = new FormData();
      fd.append("video", blob, "interview.webm");
      fd.append("answersJson", answersJson);

      const res = await fetch(
        `/api/interview/${encodeURIComponent(applicationId)}/upload`,
        {
          method: "POST",
          credentials: "include",
          body: fd,
        }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit interview");
      }

      setSubmitted(true);

      // You can change this redirect to a dedicated results page later
      alert("Interview submitted successfully! Your responses are under review.");
      router.push("/candidate/job-profiles");
    } catch (e) {
      console.error("Submit error:", e);
      alert(e.message || "Failed to submit interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = useMemo(
    () => (questions.length ? questions[currentIndex] : null),
    [questions, currentIndex]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Layout role="CANDIDATE" active="job-profiles">
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
            Round 2 · AI Video Interview
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            One-Way AI Video Interview
          </h1>
          <p className="text-gray-600 mb-6">
            Answer the questions while your camera records your responses.
            When you&apos;re done, stop the recording and submit. Your video
            will be analyzed and shared with the recruiter.
          </p>

          {loading && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600">
                Loading interview details…
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="font-semibold text-red-800">
                Unable to start interview
              </p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid lg:grid-cols-[2fr_1.4fr] gap-8">
              {/* Camera card */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Camera Preview
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Make sure your face is clearly visible. Maintain eye contact.
                </p>

                <div className="relative flex-1 rounded-2xl bg-black overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!hasStarted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 text-white px-4 py-2 rounded-full text-xs">
                        Click &quot;Start Answer&quot; to begin recording
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {meta?.title && (
                      <span className="font-semibold text-gray-800">
                        {meta.title}
                      </span>
                    )}
                    {meta?.company && (
                      <span className="ml-1 text-gray-600">
                        · {meta.company}
                      </span>
                    )}
                  </span>
                  {meta?.durationMinutes && (
                    <span>
                      Approx duration:{" "}
                      <span className="font-semibold">
                        {meta.durationMinutes} min
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Question + controls */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                      Question {currentIndex + 1} of {questions.length || 0}
                    </div>
                    {isRecording && (
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Recording…
                      </div>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-gray-900">
                    {currentQuestion?.text || "No question loaded"}
                  </h2>

                  <ul className="mt-4 text-xs text-gray-600 space-y-1">
                    <li>• Speak clearly at a moderate pace.</li>
                    <li>• Try to give examples from your experience.</li>
                    <li>• You can move between questions while recording.</li>
                    <li>• Click “Stop &amp; Submit” only when you&apos;re done.</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={isRecording || isSubmitting || submitted}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold shadow-sm transition ${
                        isRecording || submitted
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {hasStarted ? "Resume Recording" : "Start Answer"}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      disabled={
                        !hasStarted ||
                        currentIndex >= questions.length - 1 ||
                        submitted
                      }
                      className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next Question →
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleStopAndSubmit}
                    disabled={
                      isSubmitting || submitted || !hasStarted || isRecording === false
                    }
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-red-600 text-white shadow hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting
                      ? "Uploading & Analyzing…"
                      : submitted
                      ? "Submitted"
                      : "Stop & Submit"}
                  </button>

                  <p className="text-[11px] text-gray-500 text-center">
                    Once submitted, this attempt cannot be re-recorded.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default VideoInterviewLive;
