// components/proctoring/ProctoringCamera.js
import { useEffect, useRef, useState } from "react";

export default function ProctoringCamera({
  onViolation,
  maxViolations = 3,
  className = "",
}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [permGranted, setPermGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState("Camera initializing…");
  const [violationCount, setViolationCount] = useState(0);

  // Load TF + BlazeFace once
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        setLoadingModel(true);
        const tf = await import("@tensorflow/tfjs");
        // Use WebGL backend if available for speed
        if (tf.getBackend() !== "webgl" && tf.backend().isDisposed !== true) {
          try {
            await tf.setBackend("webgl");
            await tf.ready();
          } catch {}
        }
        const blazeface = await import("@tensorflow-models/blazeface");
        const m = await blazeface.load();
        if (!cancelled) {
          setModel(m);
          setLoadingModel(false);
          setStatus("Model ready. Waiting for camera…");
        }
      } catch (err) {
        console.error("Failed to load BlazeFace:", err);
        if (!cancelled) {
          setErrorMsg("Failed to initialize AI proctoring.");
          setLoadingModel(false);
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  // Start camera
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg("Camera is not supported in this browser.");
        return;
      }
      try {
        setStatus("Requesting camera permission…");
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360 },
          audio: false,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        setPermGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          try {
            await videoRef.current.play();
          } catch {}
        }
        setStatus("Camera active. Proctoring running.");
      } catch (err) {
        console.error("Camera error:", err);
        setPermGranted(false);
        setErrorMsg(
          "Camera permission denied. Click the camera icon near the address bar → Allow → then reload this page."
        );
        setStatus("Camera permission denied.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
    };
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  // Simple face / gaze checks
  useEffect(() => {
    if (!model || !permGranted || !videoRef.current) return;

    let cancelled = false;
    let intervalId = null;

    const checkFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const predictions = await model.estimateFaces(videoRef.current, false);
        if (!predictions || predictions.length === 0) {
          flagViolation("No face detected");
          setStatus("No face detected. Please stay in frame.");
          return;
        }

        if (predictions.length > 1) {
          flagViolation("Multiple faces detected");
          setStatus("Multiple faces detected. Only you should be visible.");
          return;
        }

        // Single face – basic “gaze” heuristic using bounding box center
        const face = predictions[0];

        // BlazeFace gives topLeft & bottomRight as [x, y]
        const [x1, y1] = face.topLeft;
        const [x2, y2] = face.bottomRight;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;

        const video = videoRef.current;
        const nx = cx / video.videoWidth;
        const ny = cy / video.videoHeight;

        // If face center far from middle of frame, assume looking away / moved
        const offCenterX = Math.abs(nx - 0.5) > 0.3; // left/right
        const offCenterY = ny < 0.25 || ny > 0.85; // too high/low

        if (offCenterX || offCenterY) {
          flagViolation("Possible looking away from screen");
          setStatus(
            "Please look at the screen. Frequent looking away may auto-submit your test."
          );
          return;
        }

        // All good
        setStatus("Proctoring OK. Keep looking at the screen.");
      } catch (err) {
        console.error("Proctoring error:", err);
      }
    };

    const flagViolation = (reason) => {
      setViolationCount((prev) => {
        const next = prev + 1;
        if (onViolation) {
          onViolation({ reason, count: next, max: maxViolations });
        }
        return next;
      });
    };

    intervalId = setInterval(() => {
      if (!cancelled) checkFrame();
    }, 1500); // every 1.5s

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [model, permGranted, onViolation, maxViolations]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="rounded-xl overflow-hidden bg-black h-44 w-60 self-end">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      <div className="text-right text-xs space-y-1">
        <div className="flex items-center justify-end gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              permGranted ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          <span className="text-gray-700">
            {loadingModel
              ? "Loading AI model…"
              : permGranted
              ? "Camera & AI active"
              : "Camera not active"}
          </span>
        </div>

        <p className="text-[11px] text-amber-600">{status}</p>
        {errorMsg && <p className="text-[11px] text-red-600">{errorMsg}</p>}
      </div>
    </div>
  );
}
