import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function MockTestInstructions() {
  const videoRef = useRef(null);
  const [permRequested, setPermRequested] = useState(false);
  const [permGranted, setPermGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // clear previous run state
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
        "Permission was blocked or unavailable. Click the camera icon in Chrome’s address bar and allow camera & microphone for this site, then try again."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Mock Aptitude Test (AI)</h1>
        <div className="mt-3">
          <h2 className="font-semibold">Instructions</h2>
          <ul className="list-disc pl-5 mt-2 text-sm opacity-90 space-y-1">
            <li>Total time: 10 minutes</li>
            <li>Number of questions: 10 (single-correct MCQs)</li>
            <li>Webcam preview and microphone are required (preview only, no recording).</li>
            <li>Do not refresh the page during the test.</li>
            <li>On timeout, your test will auto-submit.</li>
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Test Camera & Microphone</h3>
          {!permGranted ? (
            <div className="space-y-3">
              <p className="text-sm opacity-80">
                Click the button below. If prompted by Chrome, choose <span className="font-semibold">Allow</span> for
                camera & mic. You can also click the camera icon in the address bar to manage permissions.
              </p>
              <button className="btn outline" onClick={requestPermissions}>
                {permRequested ? "Try Again" : "Enable Camera & Microphone"}
              </button>
              {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden bg-black/30 inline-block">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-64 h-40 object-cover"
                />
              </div>
              <p className="text-sm text-emerald-300">Camera & microphone look good!</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Link href="/candidate/mock-test-live" className="btn primary">
            Start Test
          </Link>
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
