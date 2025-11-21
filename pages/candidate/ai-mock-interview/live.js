// pages/candidate/ai-mock-interview/live.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

const INTERVIEW_QUESTIONS = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths and how do they apply to this role?",
  "Describe a challenging project you worked on and how you overcame obstacles.",
  "Where do you see yourself in 5 years?",
  "Why should we hire you for this position?",
];

export default function LiveMockInterview() {
  const router = useRouter();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [status, setStatus] = useState("setup"); // setup, ready, recording, processing, complete
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question
  const [stream, setStream] = useState(null);

  // Initialize webcam and microphone
  useEffect(() => {
    let mounted = true;

    async function setupMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        if (!mounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStatus("ready");
      } catch (err) {
        console.error("Media access error:", err);
        alert("Please allow camera and microphone access to continue.");
      }
    }

    setupMedia();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Countdown timer for answer
  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isRecording && timeLeft === 0) {
      handleStopRecording();
    }
  }, [isRecording, timeLeft]);

  const startRecording = () => {
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          beginRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      processAnswer(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setTimeLeft(120);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAnswer = async (videoBlob) => {
    setStatus("processing");

    try {
      // Simulate AI analysis (replace with real API call)
      const mockScores = {
        appearance: Math.floor(Math.random() * 20) + 70,
        language: Math.floor(Math.random() * 20) + 70,
        confidence: Math.floor(Math.random() * 20) + 75,
        contentDelivery: Math.floor(Math.random() * 20) + 70,
        knowledge: Math.floor(Math.random() * 20) + 65,
      };

      const newAnswers = [
        ...answers,
        {
          question: INTERVIEW_QUESTIONS[currentQuestion],
          videoBlob,
          scores: mockScores,
          transcript: transcript || "Answer recorded",
        },
      ];

      setAnswers(newAnswers);
      setTranscript("");

      // Move to next question or finish
      if (currentQuestion < INTERVIEW_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setStatus("ready");
      } else {
        finishInterview(newAnswers);
      }
    } catch (err) {
      console.error("Processing error:", err);
      alert("Failed to process answer. Please try again.");
      setStatus("ready");
    }
  };

  const finishInterview = async (finalAnswers) => {
    setStatus("complete");

    // Calculate overall scores
    let totalAppearance = 0,
      totalLanguage = 0,
      totalConfidence = 0,
      totalDelivery = 0,
      totalKnowledge = 0;

    finalAnswers.forEach((ans) => {
      totalAppearance += ans.scores.appearance;
      totalLanguage += ans.scores.language;
      totalConfidence += ans.scores.confidence;
      totalDelivery += ans.scores.contentDelivery;
      totalKnowledge += ans.scores.knowledge;
    });

    const count = finalAnswers.length;
    const averageScores = {
      appearance: Math.round(totalAppearance / count),
      language: Math.round(totalLanguage / count),
      confidence: Math.round(totalConfidence / count),
      contentDelivery: Math.round(totalDelivery / count),
      knowledge: Math.round(totalKnowledge / count),
    };

    // Submit to backend
    try {
      const res = await fetch("/api/mock-interview/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(averageScores),
      });

      if (!res.ok) throw new Error("Failed to save results");

      // Cleanup stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/candidate/ai-mock-interview");
      }, 3000);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to save results. Please try again.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (status === "setup") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              animation: "spin 1s linear infinite",
              marginBottom: 20,
            }}
          >
            ⚙️
          </div>
          <h2>Setting up your interview...</h2>
          <p style={{ color: "var(--muted)", marginTop: 10 }}>
            Please allow camera and microphone access
          </p>
        </div>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Interview Complete!</h2>
          <p style={{ color: "var(--muted)", marginTop: 10 }}>
            Your responses have been analyzed. Redirecting to results...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>
              Question {currentQuestion + 1} of {INTERVIEW_QUESTIONS.length}
            </h2>
            <p style={{ color: "var(--muted)", marginTop: 4 }}>
              Answer the question clearly and confidently
            </p>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: timeLeft < 30 ? "#ef4444" : "#3b82f6",
            }}
          >
            {isRecording ? formatTime(timeLeft) : "--:--"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Left: Video */}
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              position: "relative",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              aspectRatio: "16/9",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {countdown > 0 && countdown < 4 && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: 120,
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                {countdown}
              </div>
            )}

            {isRecording && (
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  background: "#ef4444",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                RECORDING
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
            {!isRecording ? (
              <button
                className="btn primary"
                onClick={startRecording}
                style={{ fontSize: 18, padding: "12px 32px" }}
              >
                Start Answer
              </button>
            ) : (
              <button
                className="btn"
                onClick={handleStopRecording}
                style={{
                  fontSize: 18,
                  padding: "12px 32px",
                  background: "#ef4444",
                }}
              >
                Stop & Submit
              </button>
            )}
          </div>
        </div>

        {/* Right: Question & Tips */}
        <div className="space-y-4">
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Your Question:</h3>
            <p style={{ fontSize: 18, lineHeight: 1.6 }}>
              {INTERVIEW_QUESTIONS[currentQuestion]}
            </p>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 8 }}>💡 Tips</h4>
            <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Maintain eye contact with camera</li>
              <li>Speak clearly and at a moderate pace</li>
              <li>Use specific examples</li>
              <li>Keep answers between 1-2 minutes</li>
              <li>Show enthusiasm and confidence</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 8 }}>📊 Progress</h4>
            <div style={{ display: "flex", gap: 8 }}>
              {INTERVIEW_QUESTIONS.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    background:
                      idx < currentQuestion
                        ? "#10b981"
                        : idx === currentQuestion
                        ? "#3b82f6"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}

LiveMockInterview.getLayout = (page) => (
  <Layout role="CANDIDATE" active="ai-mock">
    {page}
  </Layout>
);