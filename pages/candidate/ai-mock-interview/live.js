// pages/candidate/ai-mock-interview/live.js
// Multi-question live recording with upload to Firebase Storage + AI submit

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

import useCamera from "../../../hooks/useCamera";
import useRecording from "../../../hooks/useRecording";
import useEyeDetection from "../../../hooks/useEyeDetection";
import useFaceTracking from "../../../hooks/useFaceTracking";
import { uploadInterviewVideo } from "../../../firebase/uploadVideo";
import { useAuth } from "@/lib/auth";

const INTERVIEW_QUESTIONS = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths and how do they apply to this role?",
  "Describe a challenging project you worked on and how you overcame obstacles.",
  "Where do you see yourself in 3-5 years?",
  "Why should we hire you for this position?",
];

const QUESTION_TIME_LIMIT = 120; // seconds per question

export default function LiveMockInterview() {
  const router = useRouter();
  const { interviewId: interviewIdQuery } = router.query;

  // Normalise interviewId -> string
  const interviewId = Array.isArray(interviewIdQuery)
    ? interviewIdQuery[0]
    : interviewIdQuery || null;

  const authCtx = (() => {
    try {
      return useAuth();
    } catch {
      return null;
    }
  })();

  const user = authCtx?.user || null;

  // Camera & recording hooks
  const { videoRef, mediaStream, startCamera, stopCamera } = useCamera();

  const {
    isRecording,
    recordedBlob,
    recordingStartTime,
    startRecording,
    stopRecording,
  } = useRecording();

  // Eye detection + face tracking
  const {
    eyeContactPercent,
    registerFrame,
    resetEyeContact,
    rawEyeContactStats,
  } = useEyeDetection();

  useFaceTracking(videoRef, {
    enabled: isRecording,
    onLandmarks: (landmarks) => {
      registerFrame(landmarks);
    },
  });

  // Speech recognition
  const recognitionRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // UI state
  const [status, setStatus] = useState("ready"); // ready | running | processing | complete
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [processingStage, setProcessingStage] = useState("");
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(null); // 0–100 during upload

  // Hide chatbot while recording
  const hideChatbot = useCallback(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("chatbot-widget");
    if (el) {
      el.dataset.originalDisplay = el.style.display;
      el.style.display = "none";
    }
  }, []);

  const showChatbot = useCallback(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("chatbot-widget");
    if (el) {
      el.style.display = el.dataset.originalDisplay || "";
    }
  }, []);

  useEffect(() => {
    if (status === "running" || status === "processing") {
      hideChatbot();
    } else {
      showChatbot();
    }
  }, [status, hideChatbot, showChatbot]);

  // TIMER
  useEffect(() => {
    if (status !== "running") return;

    if (timeLeft <= 0) {
      if (currentQuestion < INTERVIEW_QUESTIONS.length - 1) {
        setCurrentQuestion((idx) => idx + 1);
        setTimeLeft(QUESTION_TIME_LIMIT);
      } else {
        handleStopAndSubmit();
      }
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, timeLeft, currentQuestion]);

  // SPEECH RECOGNITION
  const startSpeechRecognition = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let full = "";
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript + " ";
        }
        const finalText = full.trim();
        setTranscript(finalText);
        setWordCount(
          finalText ? finalText.split(/\s+/).filter(Boolean).length : 0
        );
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
      };

      recognition.onend = () => {
        if (status === "running") {
          try {
            recognition.start();
          } catch (err) {
            console.warn("Could not restart speech recognition:", err);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecognizing(true);
      console.log("✅ Speech recognition started");
    } catch (err) {
      console.error("Speech recognition error:", err);
    }
  }, [status]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
      recognitionRef.current = null;
    }
    setIsRecognizing(false);
  }, []);

  // START ANSWER
  const startAnswer = async () => {
    if (status === "running") return;

    setError("");
    setTranscript("");
    setWordCount(0);
    resetEyeContact();

    // Ensure camera is on
    let stream = mediaStream;
    if (!stream) {
      stream = await startCamera();
      if (!stream) {
        setError(
          "Unable to access camera/microphone. Please allow permissions."
        );
        return;
      }
    }

    startRecording(stream);
    startSpeechRecognition();
    setStatus("running");
    setTimeLeft(QUESTION_TIME_LIMIT);
  };

  // STOP & SUBMIT FULL INTERVIEW
  const handleStopAndSubmit = async () => {
    if (status === "processing" || status === "complete") return;

    // Normalise / final safety for interviewId
    const effectiveInterviewId =
      interviewId ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("interviewId")
        : null);

    if (!effectiveInterviewId) {
      setError("Interview ID missing. Please restart the interview.");
      console.error("[LIVE] Missing interviewId, cannot submit.");
      return;
    }

    setStatus("processing");
    setProcessingStage("Stopping recording and preparing your interview...");
    setUploadProgress(null);
    setError("");
    stopSpeechRecognition();

    try {
      console.log("[LIVE] handleStopAndSubmit called");

      // 1) Stop recording and get Blob
      const blob = await stopRecording();
      const videoBlob = blob || recordedBlob;

      // Turn off camera as soon as we have the video
      stopCamera();

      if (!videoBlob) {
        throw new Error("No recorded video found. Please record first.");
      }

      // Determine userId from auth (fallback to demo)
      const effectiveUserId =
        user?.uid ||
        user?.id ||
        user?.userId ||
        user?._id ||
        "demoUser123";

      console.log("[LIVE] Using userId:", effectiveUserId);

      // 2) Upload video to Firebase Storage
      setProcessingStage("Uploading video to cloud...");
      setUploadProgress(0);

      console.log("[LIVE] Uploading video...");
      const uploadResult = await uploadInterviewVideo(
        videoBlob,
        effectiveUserId,
        (pct) => {
          setUploadProgress(pct);
          setProcessingStage(`Uploading video to cloud... ${pct}%`);
        }
      );

      console.log("[LIVE] Video uploaded:", uploadResult.downloadUrl);

      // 3) Call backend for AI analysis
      setProcessingStage("Running AI analysis on your interview...");

      const extraStats = {
        totalWords: wordCount,
        eyeContactFrames: rawEyeContactStats.goodFramesRef.current,
        totalFrames: rawEyeContactStats.totalFramesRef.current,
      };

      const payload = {
        interviewId: effectiveInterviewId,
        userId: effectiveUserId,
        videoUrl: uploadResult.downloadUrl,
        transcript,
        eyeContactPercent,
        extraStats,
        startedAt: recordingStartTime
          ? recordingStartTime.toISOString()
          : null,
        endedAt: new Date().toISOString(),
      };

      console.log("[LIVE] Submitting payload:", payload);

      const res = await fetch("/api/mock-interview/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("[LIVE] Submit response:", res.status, data);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit interview");
      }

      console.log("✅ Interview submitted. Attempt:", data.attemptId);
      setProcessingStage("Complete! Redirecting to your AI feedback...");
      setStatus("complete");

      // 🔁 IMPORTANT: go directly to the results page for THIS interview
      setTimeout(() => {
        router.push(
          `/candidate/ai-mock-interview/result?interviewId=${encodeURIComponent(
            effectiveInterviewId
          )}`
        );
      }, 1200);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit interview. Please try again.");
      setStatus("ready");
    } finally {
      stopCamera();
      stopSpeechRecognition();
      setUploadProgress(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const disabled = status === "processing" || status === "complete";
  const eyeContactScore = Math.round(eyeContactPercent || 0);

  // PROCESSING screen
  if (status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl border p-12 text-center max-w-md">
          <div className="text-6xl mb-4 animate-pulse">🤖</div>
          <h2 className="text-2xl font-bold mb-2">AI is analyzing...</h2>
          <p className="text-gray-600 mb-4">{processingStage}</p>

          {uploadProgress !== null && (
            <div className="w-full max-w-xs mx-auto mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload progress: {uploadProgress}%
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-500">
            <div>📊 Computing scores...</div>
            <div>🎤 Analyzing speech...</div>
            <div>👁️ Evaluating eye contact...</div>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETE screen – brief “done” state before redirect
  if (status === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl border p-12 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-2">Interview Complete!</h2>
          <p className="text-gray-600 mb-6">{processingStage}</p>
          <div className="space-y-2 text-sm text-green-600">
            <div>✅ Video uploaded to cloud</div>
            <div>✅ AI analysis complete</div>
            <div>✅ Scores calculated</div>
            <div>➡ Redirecting you to the results page…</div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN UI
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">AI Mock Interview</h1>
        <p className="text-lg text-gray-600 mt-3">
          Answer questions naturally while AI evaluates your performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: video */}
        <div className="bg-white rounded-xl border p-8">
          <h2 className="text-2xl font-bold mb-4">Camera Preview</h2>
          <p className="text-sm text-gray-600 mb-4">
            Make sure your face is clearly visible. Maintain eye contact.
          </p>

          <div
            className="relative bg-black rounded-xl overflow-hidden"
            style={{ aspectRatio: "16/9" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                RECORDING
              </div>
            )}

            {isRecording && (
              <div className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                👁️ {eyeContactScore > 70 ? "Good" : "OK"} Eye Contact
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 right-4 text-white text-3xl font-bold">
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {isRecording && transcript && (
            <div className="mt-4 bg-gray-50 border rounded-lg p-4 max-h-24 overflow-auto">
              <p className="text-xs text-gray-500 uppercase mb-1">
                Live Transcript
              </p>
              <p className="text-sm">
                {transcript.length > 200
                  ? `${transcript.slice(-200)}...`
                  : transcript}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-8">
            <p className="text-sm font-semibold text-indigo-600 uppercase mb-2">
              Question {currentQuestion + 1} of {INTERVIEW_QUESTIONS.length}
            </p>
            <h2 className="text-2xl font-bold mb-4">
              {INTERVIEW_QUESTIONS[currentQuestion]}
            </h2>

            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRecording ? "bg-red-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              <span className="text-sm font-medium">
                {status === "running"
                  ? "Recording in progress"
                  : status === "ready"
                  ? "Ready to start"
                  : "Preparing..."}
              </span>
            </div>

            {isRecording && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {wordCount}
                  </div>
                  <div className="text-xs text-gray-600">Words</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {eyeContactScore}%
                  </div>
                  <div className="text-xs text-gray-600">Eye Contact</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={startAnswer}
                disabled={disabled || status === "running"}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                {status === "running" ? "Recording..." : "🎤 Start Answer"}
              </button>

              <button
                onClick={() => {
                  if (currentQuestion < INTERVIEW_QUESTIONS.length - 1) {
                    setCurrentQuestion((idx) => idx + 1);
                    setTimeLeft(QUESTION_TIME_LIMIT);
                  } else {
                    handleStopAndSubmit();
                  }
                }}
                disabled={disabled || status !== "running"}
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                {currentQuestion === INTERVIEW_QUESTIONS.length - 1
                  ? "Finish Interview"
                  : "Next Question →"}
              </button>

              <button
                onClick={handleStopAndSubmit}
                disabled={disabled}
                className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Stop & Submit
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold mb-3">💡 Tips</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Maintain eye contact with camera</li>
              <li>• Speak clearly at moderate pace</li>
              <li>• Minimize filler words (um, uh, like)</li>
              <li>• Use specific examples</li>
              <li>• Show enthusiasm</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold mb-3">📊 Progress</h3>
            <div className="flex gap-2">
              {INTERVIEW_QUESTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-2 rounded"
                  style={{
                    background:
                      idx < currentQuestion
                        ? "#10b981"
                        : idx === currentQuestion
                        ? "#3b82f6"
                        : "#e5e7eb",
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {currentQuestion + 1} of {INTERVIEW_QUESTIONS.length} complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

LiveMockInterview.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="ai-mock">
      {page}
    </Layout>
  );
};
