// components/proctoring/ProctoringCamera.js
import { useEffect, useRef, useState } from "react";

/**
 * Shared AI proctoring camera for all exams.
 *
 * Props:
 * - maxViolations: numeric limit; parent decides auto-submit on or before this.
 * - onViolation: fn({ reason, type, count, max }) called when a violation is registered.
 * - className: extra wrapper classes
 */
export default function ProctoringCamera({
  onViolation,
  maxViolations = 5,
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

  // small grace thresholds → avoid flagging on 1 bad frame
  const GRACE = {
    noFaceFrames: 3,
    multiFaceFrames: 2,
    lookAwayFrames: 3,
  };

  const countersRef = useRef({
    noFaceFrames: 0,
    multiFaceFrames: 0,
    lookAwayFrames: 0,
  });

  const lastViolationRef = useRef({
    reason: null,
    ts: 0,
  });

  // Load TF + BlazeFace once
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        setLoadingModel(true);
        const tf = await import("@tensorflow/tfjs");
        try {
          if (tf.getBackend() !== "webgl") {
            await tf.setBackend("webgl");
          }
          await tf.ready();
        } catch {
          // fallback to default backend silently
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
          } catch {
            // ignore autoplay issues
          }
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

  const registerViolation = (reason, type = "camera") => {
    setViolationCount((prev) => {
      const next = prev + 1;

      // debounce repeated same-reason spam (e.g. model jitter)
      const now = Date.now();
      if (
        lastViolationRef.current.reason === reason &&
        now - lastViolationRef.current.ts < 1500
      ) {
        return prev;
      }
      lastViolationRef.current = { reason, ts: now };

      if (onViolation) {
        onViolation({ reason, type, count: next, max: maxViolations });
      }
      return next;
    });
  };

  // Simple face / gaze checks with grace
  useEffect(() => {
    if (!model || !permGranted || !videoRef.current) return;

    let cancelled = false;
    let intervalId = null;

    const checkFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const predictions = await model.estimateFaces(videoRef.current, false);
        const counters = countersRef.current;

        if (!predictions || predictions.length === 0) {
          counters.noFaceFrames += 1;
          counters.multiFaceFrames = 0;
          counters.lookAwayFrames = 0;

          if (counters.noFaceFrames >= GRACE.noFaceFrames) {
            registerViolation("No face detected", "camera");
            counters.noFaceFrames = 0;
          }

          setStatus("No face detected. Please stay in frame.");
          return;
        }

        // exactly one face
        if (predictions.length > 1) {
          counters.multiFaceFrames += 1;
          counters.noFaceFrames = 0;
          counters.lookAwayFrames = 0;

          if (counters.multiFaceFrames >= GRACE.multiFaceFrames) {
            registerViolation("Multiple faces detected", "camera");
            counters.multiFaceFrames = 0;
          }

          setStatus("Multiple faces detected. Only you should be visible.");
          return;
        }

        counters.noFaceFrames = 0;
        counters.multiFaceFrames = 0;

        const face = predictions[0];
        const [x1, y1] = face.topLeft;
        const [x2, y2] = face.bottomRight;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;

        const video = videoRef.current;
        const nx = cx / video.videoWidth;
        const ny = cy / video.videoHeight;

        const offCenterX = Math.abs(nx - 0.5) > 0.35;
        const offCenterY = ny < 0.2 || ny > 0.85;

        if (offCenterX || offCenterY) {
          counters.lookAwayFrames += 1;
          if (counters.lookAwayFrames >= GRACE.lookAwayFrames) {
            registerViolation("Possible looking away from screen", "camera");
            counters.lookAwayFrames = 0;
          }

          setStatus(
            "Please look at the screen. Frequent looking away may auto-submit your test."
          );
          return;
        }

        // all good frame
        counters.lookAwayFrames = 0;
        setStatus("Proctoring OK. Keep looking at the screen.");
      } catch (err) {
        console.error("Proctoring error:", err);
      }
    };

    intervalId = setInterval(() => {
      if (!cancelled) checkFrame();
    }, 1500);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [model, permGranted, maxViolations, onViolation]);

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
