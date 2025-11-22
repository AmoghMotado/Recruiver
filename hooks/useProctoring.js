// hooks/useProctoring.js
import { useEffect, useRef, useState } from "react";

/**
 * Props:
 * - onAutoSubmit(reason)  // called when we decide exam must be auto-submitted
 * - maxTabViolations = 3
 * - maxAttentionViolations = 5
 */
export function useProctoring({ onAutoSubmit, maxTabViolations = 3, maxAttentionViolations = 5 }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const [tabViolations, setTabViolations] = useState(0);
  const [attentionViolations, setAttentionViolations] = useState(0);
  const [warning, setWarning] = useState("");

  // Start webcam
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error("Camera access failed", err);
        setWarning("Camera access denied. Proctoring may be limited.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  // Basic face/attention detection using FaceDetector if available
  useEffect(() => {
    if (!("FaceDetector" in window)) return;

    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });

    async function checkFace() {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const faces = await detector.detect(videoRef.current);
        if (!faces || faces.length === 0) {
          setAttentionViolations((prev) => {
            const next = prev + 1;
            setWarning("Please keep your face in view. Attention violation logged.");
            if (next >= maxAttentionViolations) {
              onAutoSubmit && onAutoSubmit("attention-violation");
            }
            return next;
          });
        }
      } catch (err) {
        console.warn("Face detection failed", err);
      }
    }

    faceCheckIntervalRef.current = setInterval(checkFace, 5000);

    return () => {
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
      }
    };
  }, [maxAttentionViolations, onAutoSubmit]);

  // Tab / window switch detection
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        incrementTabViolation();
      }
    }

    function handleBlur() {
      incrementTabViolation();
    }

    function incrementTabViolation() {
      setTabViolations((prev) => {
        const next = prev + 1;
        setWarning("Tab/window switch detected. Violation logged.");
        if (next >= maxTabViolations) {
          onAutoSubmit && onAutoSubmit("tab-switch-violation");
        }
        return next;
      });
    }

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [maxTabViolations, onAutoSubmit]);

  // Disable chat widget in exam: hide any button that says "Chat"
  useEffect(() => {
    function hideChat() {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((btn) => {
        if (btn.innerText && btn.innerText.trim().toLowerCase() === "chat") {
          btn.style.display = "none";
        }
      });
    }

    hideChat();
    const obs = new MutationObserver(hideChat);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      // we don't restore chat button styling on purpose during this page
    };
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // expose a manual stop method for when exam ends
  return {
    videoRef,
    stopCamera,
    tabViolations,
    attentionViolations,
    warning,
  };
}
