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
    <div className="py-8">
      {/* Main Card Container matching previous page style */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden max-w-6xl mx-auto">
        
        {/* Unified Header */}
        <div className="text-center pt-10 pb-8 px-6 border-b border-gray-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            Step 2 of 3
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Test <span className="text-indigo-600">Instructions</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Carefully review the rules and verify your camera setup before beginning the proctored exam.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT COLUMN: RULES (Styled like "Breakdown" boxes) */}
          <div className="lg:col-span-7 p-8 lg:p-12 space-y-8">
            
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider text-sm">
              <span className="text-xl">📋</span> Exam Configuration
            </h2>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1 */}
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl mb-3">
                  ⏱️
                </div>
                <div className="font-bold text-gray-900 text-lg">60 Minutes</div>
                <div className="text-sm text-gray-500">Global Timer</div>
              </div>

              {/* Box 2 */}
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl mb-3">
                  ❓
                </div>
                <div className="font-bold text-gray-900 text-lg">60 Questions</div>
                <div className="text-sm text-gray-500">MCQ Format</div>
              </div>
            </div>

            {/* Detailed Rules List */}
            <div className="space-y-4 mt-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider text-sm">
                <span className="text-xl">⚠️</span> Critical Violations
              </h2>
              
              <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                <ul className="space-y-3">
                  <li className="flex gap-3 text-red-800 text-sm font-medium items-start">
                    <span className="mt-0.5 text-lg">🚫</span>
                    <span>
                      <strong className="block text-red-900">Do NOT Refresh</strong>
                      Refreshing or closing the page will result in immediate auto-submission.
                    </span>
                  </li>
                  <li className="flex gap-3 text-red-800 text-sm font-medium items-start">
                    <span className="mt-0.5 text-lg">👁️</span>
                    <span>
                      <strong className="block text-red-900">AI Proctoring Active</strong>
                      Face monitoring and tab-switch detection are active. Excessive violations will terminate the test.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CAMERA SETUP (Styled like the "Action" area) */}
          <div className="lg:col-span-5 bg-gray-50 p-8 lg:p-12 border-l border-gray-100 flex flex-col justify-center">
            
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              🎬 Camera Setup
            </h2>

            {/* Camera Preview Box */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg aspect-video mb-6 ring-4 ring-white">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {!permGranted && !errorMsg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-zinc-900">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <span className="text-3xl">📹</span>
                  </div>
                  <p className="text-sm font-medium">Waiting for permission...</p>
                </div>
              )}

              {permGranted && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"/> LIVE
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-white border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mb-6">
                <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={requestPermissions}
                disabled={permRequested}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2 ${
                  permGranted
                    ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                }`}
              >
                {permGranted ? (
                  <>🔄 Restart Camera</>
                ) : permRequested ? (
                  <>⏳ Requesting...</>
                ) : (
                  <>📸 Enable Camera</>
                )}
              </button>

              {/* Start Test Button - Matches the "Begin Assessment" style */}
              {permGranted && (
                <Link
                  href="/candidate/mock-test-live"
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Start Assessment <span>→</span>
                </Link>
              )}
              
              {!permGranted && (
                <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg text-center border border-blue-100">
                   Camera access is required to proceed.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer Text */}
      <div className="text-center mt-6 text-gray-400 text-sm">
        Protected by Recruiver AI Proctoring System
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