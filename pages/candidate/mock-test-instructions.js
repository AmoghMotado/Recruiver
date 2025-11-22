// pages/candidate/mock-test-instructions.js
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function MockTestInstructions() {
  const videoRef = useRef(null);
  const [permRequested, setPermRequested] = useState(false);
  const [permGranted, setPermGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    try {
      localStorage.removeItem("mockTest.answers");
      localStorage.removeItem("mockTest.status");
      localStorage.removeItem("mockTest.score");
      localStorage.removeItem("mockTest.summary");
      localStorage.removeItem("mockTest.order");
    } catch {}
  }, []);

  const requestPermissions = async () => {
    setPermRequested(true);
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermGranted(true);
    } catch (err) {
      setPermGranted(false);
      setErrorMsg(
        "Permission blocked. Click the camera icon in your browser's address bar, allow camera & microphone, then try again."
      );
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Test Instructions</h1>
        <p className="text-lg text-gray-600 mt-3">
          Review the requirements and verify your camera setup before starting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Instructions */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Test Rules</h2>
          <ul className="space-y-4">
            {[
              { icon: "⏱️", label: "Time Limit", desc: "10 minutes total" },
              { icon: "❓", label: "Questions", desc: "10 single-correct MCQs" },
              { icon: "🎥", label: "Camera/Mic", desc: "Required for proctored mode" },
              { icon: "🔄", label: "Page Refresh", desc: "Do NOT refresh during test" },
              { icon: "⏰", label: "Auto-Submit", desc: "Test submits on timeout" },
            ].map((rule, i) => (
              <div key={i} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                <div className="text-3xl flex-shrink-0">{rule.icon}</div>
                <div>
                  <div className="font-bold text-gray-900">{rule.label}</div>
                  <div className="text-sm text-gray-600">{rule.desc}</div>
                </div>
              </div>
            ))}
          </ul>
        </div>

        {/* Camera Setup */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎬 Camera Setup</h2>

          {!permGranted ? (
            <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div className="bg-gray-100 rounded-xl h-40 flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-4xl mb-2">📹</div>
                  <p className="text-sm text-gray-600">Camera feed will appear here</p>
                </div>
              </div>

              <button
                onClick={requestPermissions}
                className={`px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                  permRequested
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg"
                }`}
              >
                {permRequested ? "⏳ Requesting Permission..." : "✓ Enable Camera & Microphone"}
              </button>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{errorMsg}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="rounded-xl overflow-hidden bg-black flex-1 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <span className="text-2xl">✓</span>
                <div>
                  <div className="font-bold text-emerald-900">Camera & Microphone Ready</div>
                  <div className="text-sm text-emerald-700">You're all set to begin</div>
                </div>
              </div>
            </div>
          )}

          {permGranted && (
            <Link
              href="/candidate/mock-test-live"
              className="mt-6 w-full inline-flex items-center justify-center px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:shadow-lg transition-all"
            >
              Start Test →
            </Link>
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