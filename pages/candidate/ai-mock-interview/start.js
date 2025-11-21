// pages/candidate/ai-mock-interview/start.js
import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";

export default function AIMockStart() {
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const meterRef = useRef(null);

  const [micLevel, setMicLevel] = useState(0);
  const [timer, setTimer] = useState(60);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);

  const QUESTIONS = [
    "Tell me about yourself.",
    "Why should we hire you?",
    "Describe a challenging situation and how you handled it.",
    "Where do you see yourself in 5 years?",
  ];

  // Initialize camera + mic
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Attach stream to video
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Audio meter setup
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        meterRef.current = analyser;

        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function updateMeter() {
          if (!meterRef.current) return;

          analyser.getByteFrequencyData(dataArray);
          const avg =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

          setMicLevel(Math.min(100, Math.round((avg / 256) * 100)));

          requestAnimationFrame(updateMeter);
        }

        updateMeter();
      } catch (err) {
        alert("Camera/Mic not accessible");
        console.error(err);
      }
    }

    setupMedia();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!recording) return;
    if (timer <= 0) return;

    const id = setTimeout(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [timer, recording]);

  const startRecording = () => {
    setRecording(true);
    setTimer(60);
  };

  const nextQuestion = () => {
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
      setTimer(60);
      setRecording(true);
    } else {
      alert("All questions finished. Submitting data...");
      finishInterview();
    }
  };

  const finishInterview = async () => {
    setRecording(false);

    // Dummy scoring (AI pipeline in Step 5)
    const fakeScores = {
      appearance: Math.floor(Math.random() * 30) + 70,
      language: Math.floor(Math.random() * 30) + 60,
      confidence: Math.floor(Math.random() * 30) + 55,
      contentDelivery: Math.floor(Math.random() * 30) + 65,
      knowledge: Math.floor(Math.random() * 30) + 70,
    };

    try {
      await fetch("/api/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: Math.round(
            Object.values(fakeScores).reduce((a, b) => a + b, 0) / 5
          ),
          details: fakeScores,
        }),
      });

      alert("Mock interview submitted successfully!");
      window.location.href = "/candidate/ai-mock-interview";
    } catch (e) {
      console.error(e);
      alert("Failed to submit interview scores");
    }
  };

  return (
    <div className="space-y-6">
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>AI Mock Interview – Live Test</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
        }}
      >
        {/* Video Feed */}
        <div className="card" style={{ padding: 20 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: 350,
              background: "#000",
              borderRadius: 10,
              objectFit: "cover",
            }}
          />

          <div style={{ marginTop: 10, fontSize: 14, color: "var(--muted)" }}>
            Camera Status: <span style={{ color: "#4ade80" }}>Active</span>
          </div>

          <div style={{ marginTop: 10 }}>
            <div>Mic Level:</div>
            <div
              style={{
                height: 8,
                width: "100%",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 4,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${micLevel}%`,
                  background:
                    "linear-gradient(90deg, #34d399, #10b981)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Question Box */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 700 }}>Question</h3>
          <p style={{ marginTop: 10, fontSize: 18 }}>
            {QUESTIONS[questionIndex]}
          </p>

          <div
            style={{
              marginTop: 20,
              fontSize: 40,
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            {timer}s
          </div>

          {!recording ? (
            <button
              className="btn-apply"
              style={{ marginTop: 20 }}
              onClick={startRecording}
            >
              Start Answer
            </button>
          ) : (
            <button
              className="btn"
              style={{ marginTop: 20 }}
              onClick={nextQuestion}
            >
              {questionIndex === QUESTIONS.length - 1
                ? "Finish Interview"
                : "Next Question"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

AIMockStart.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="ai-mock">
      {page}
    </Layout>
  );
};
