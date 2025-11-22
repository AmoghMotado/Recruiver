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
  const [timeLeft, setTimeLeft] = useState(120);
  const [stream, setStream] = useState(null);

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

    try {
      const res = await fetch("/api/mock-interview/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(averageScores),
      });

      if (!res.ok) throw new Error("Failed to save results");

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

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
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-sm">
          <div className="text-6xl mb-6 animate-spin">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900">Setting up your interview…</h2>
          <p className="text-base text-gray-600 mt-4">
            Please allow camera and microphone access to continue
          </p>
        </div>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-12 text-center max-w-md">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900">Interview Complete!</h2>
          <p className="text-lg text-gray-600 mt-4">
            Your responses are being analyzed. Redirecting to results…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Question {currentQuestion + 1} of {INTERVIEW_QUESTIONS.length}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Answer clearly and confidently. You have up to 2 minutes.
            </p>
          </div>
          <div
            className={`text-5xl font-bold font-mono ${
              timeLeft < 30 ? "text-red-600" : "text-indigo-600"
            }`}
          >
            {isRecording ? formatTime(timeLeft) : "00:00"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Feed (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {countdown > 0 && countdown < 4 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-9xl font-black text-white drop-shadow-2xl animate-bounce">
                  {countdown}
                </div>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                RECORDING
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:shadow-lg transition-all"
              >
                🎤 Start Answer
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-8 py-4 text-lg font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all"
              >
                ⏹️ Stop & Submit
              </button>
            )}
          </div>
        </div>

        {/* Right: Question & Tips */}
        <div className="space-y-6">
          {/* Question Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3">
              Your Question
            </h3>
            <p className="text-xl font-semibold text-gray-900 leading-relaxed">
              {INTERVIEW_QUESTIONS[currentQuestion]}
            </p>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-8">
            <h4 className="text-lg font-bold text-gray-900 mb-4">💡 Interview Tips</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span>👀</span> <span>Maintain eye contact with camera</span>
              </li>
              <li className="flex gap-2">
                <span>🗣️</span> <span>Speak clearly at moderate pace</span>
              </li>
              <li className="flex gap-2">
                <span>📖</span> <span>Use specific examples</span>
              </li>
              <li className="flex gap-2">
                <span>⏱️</span> <span>Keep answers 1-2 minutes</span>
              </li>
              <li className="flex gap-2">
                <span>😊</span> <span>Show enthusiasm & confidence</span>
              </li>
            </ul>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
              📊 Progress
            </h4>
            <div className="flex gap-2">
              {INTERVIEW_QUESTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-3 rounded-full transition-all"
                  style={{
                    background:
                      idx < currentQuestion
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : idx === currentQuestion
                        ? "linear-gradient(90deg, #4f46e5, #6366f1)"
                        : "#e5e7eb",
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3 text-center">
              {currentQuestion + 1} of {INTERVIEW_QUESTIONS.length} questions
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
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