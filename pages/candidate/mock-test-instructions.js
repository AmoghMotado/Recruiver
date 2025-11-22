// pages/candidate/mock-test-instructions.js
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function MockTestInstructions() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permRequested, setPermRequested] = useState(false);
  const [permGranted, setPermGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Clear previous mock test state fully
  useEffect(() => {
    try {
      localStorage.removeItem("mockTest.questions");
      localStorage.removeItem("mockTest.answers");
      localStorage.removeItem("mockTest.status");
      localStorage.removeItem("mockTest.score");
      localStorage.removeItem("mockTest.summary");
      localStorage.removeItem("mockTest.timeLeft");
      localStorage.removeItem("mockTest.attemptId");
    } catch {}
  }, []);

  // CAMERA PERMISSION + PREVIEW
  const requestPermissions = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Camera is not supported in this browser.");
      return;
    }

    setPermRequested(true);
    setErrorMsg("");

    try {
      // Stop any previous stream
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false, // keep muted → autoplay allowed
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        try {
          await videoRef.current.play();
        } catch {
          // ignore autoplay promise errors; user action already triggered this
        }
      }

      setStream(newStream);
      setPermGranted(true);
    } catch (err) {
      console.error("Camera error:", err);
      setPermGranted(false);
      setErrorMsg(
        "Camera permission denied. Click the camera icon near the address bar → Allow → then try again."
      );
    } finally {
      setPermRequested(false);
    }
  };

  // STOP CAMERA WHEN LEAVING PAGE
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-8 pb-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Test Instructions</h1>
        <p className="text-lg text-gray-600 mt-3">
          Carefully review the rules and verify your camera setup before
          beginning the proctored exam.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT CARD — EXAM RULES */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 Test Rules
          </h2>

          <ul className="space-y-4">
            <li className="flex gap-4 pb-4 border-b border-gray-200">
              <div className="text-3xl flex-shrink-0">⏱️</div>
              <div>
                <div className="font-bold text-gray-900">Time Limit</div>
                <div className="text-sm text-gray-600">
                  60 minutes (global timer)
                </div>
              </div>
            </li>

            <li className="flex gap-4 pb-4 border-b border-gray-200">
              <div className="text-3xl flex-shrink-0">❓</div>
              <div>
                <div className="font-bold text-gray-900">Total Questions</div>
                <div className="text-sm text-gray-600">
                  60 MCQs:
                  <br />• 15 Quantitative Aptitude
                  <br />• 15 Logical Reasoning
                  <br />• 15 Verbal / Communication
                  <br />• 15 Programming Concepts
                </div>
              </div>
            </li>

            <li className="flex gap-4 pb-4 border-b border-gray-200">
              <div className="text-3xl flex-shrink-0">🎥</div>
              <div>
                <div className="font-bold text-gray-900">
                  Camera / Mic Required
                </div>
                <div className="text-sm text-gray-600">
                  AI proctoring, face/attention monitoring, and tab-switch
                  detection will be active throughout the exam.
                </div>
              </div>
            </li>

            <li className="flex gap-4 pb-4 border-b border-gray-200">
              <div className="text-3xl flex-shrink-0">🚫</div>
              <div>
                <div className="font-bold text-gray-900">Do NOT Refresh</div>
                <div className="text-sm text-gray-600">
                  Refreshing/closing the page may result in automatic
                  submission.
                </div>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="text-3xl flex-shrink-0">⚠️</div>
              <div>
                <div className="font-bold text-gray-900">Auto-Submit</div>
                <div className="text-sm text-gray-600">
                  The exam will be auto-submitted on:
                  <br />• Timer expiry
                  <br />• Excessive tab-switch violations
                  <br />• Excessive face/attention violations
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* RIGHT CARD — CAMERA SETUP */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🎬 Camera Setup
          </h2>

          {/* Live / placeholder preview */}
          <div
            className="relative rounded-xl overflow-hidden bg-black mb-6 flex items-center justify-center"
            style={{ height: "320px" }} // ⬅ bigger height
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!permGranted && !errorMsg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 text-sm bg-black/50">
                <div className="text-4xl mb-2">📹</div>
                <p>Camera feed will appear here</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-800">{errorMsg}</p>
            </div>
          )}

          {/* Permission / restart button */}
          <button
            onClick={requestPermissions}
            disabled={permRequested}
            className={`px-6 py-4 rounded-lg font-bold text-lg transition-all mb-4 ${
              permRequested
                ? "bg-gray-100 text-gray-700 cursor-wait"
                : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg"
            }`}
          >
            {permGranted
              ? "Restart Camera"
              : permRequested
              ? "⏳ Requesting Permission..."
              : "✓ Enable Camera"}
          </button>

          {/* Status pill */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`w-3 h-3 rounded-full ${
                permGranted ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm text-gray-700">
              {permGranted ? "Camera Ready" : "Camera not active"}
            </span>
          </div>

          {/* NEXT BUTTON */}
          {permGranted && (
            <Link
              href="/candidate/mock-test-live"
              className="mt-auto w-full inline-flex items-center justify-center px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:shadow-lg transition-all"
            >
              Start Test →
            </Link>
          )}

          {!permGranted && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Please enable your camera before starting the test.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

MockTestInstructions.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="mock-test">
      {page}
    </Layout>
  );
};
