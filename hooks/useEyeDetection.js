// hooks/useEyeDetection.js
import { useCallback, useRef, useState } from "react";

/**
 * Eye Contact Detection Hook
 * Uses MediaPipe face mesh landmarks to detect if candidate is looking at camera
 * 
 * Expects 468-point MediaPipe face mesh landmarks.
 * Approximates "looking at camera" by checking eye-nose symmetry.
 */
export default function useEyeDetection() {
  const goodFramesRef = useRef(0);
  const totalFramesRef = useRef(0);

  const [eyeContactPercent, setEyeContactPercent] = useState(0);
  const [isGoodEyeContact, setIsGoodEyeContact] = useState(false);
  const [eyeContactInfo, setEyeContactInfo] = useState({
    average: 0,
    max: 0,
    min: 100,
    samples: 0,
  });

  /**
   * Check if face is looking at camera
   * Uses left/right eye and nose landmarks
   */
  const isFacingCamera = useCallback((landmarks) => {
    try {
      if (!landmarks || !Array.isArray(landmarks)) {
        return false;
      }

      // MediaPipe face mesh key landmark indices
      const LEFT_EYE_INDEX = 33; // Left eye outer corner
      const RIGHT_EYE_INDEX = 263; // Right eye outer corner
      const NOSE_TIP_INDEX = 1; // Nose tip

      const leftEye = landmarks[LEFT_EYE_INDEX];
      const rightEye = landmarks[RIGHT_EYE_INDEX];
      const nose = landmarks[NOSE_TIP_INDEX];

      // Validate landmarks exist
      if (!leftEye || !rightEye || !nose) {
        return false;
      }

      // Calculate eye center X coordinate
      const eyeCenterX = (leftEye[0] + rightEye[0]) / 2;

      // Calculate horizontal distance from nose to eye center
      const dx = Math.abs(eyeCenterX - nose[0]);

      // If distance is small, nose is roughly between eyes = facing camera
      // If distance is large, head is turned = not facing camera
      const THRESHOLD = 20; // pixels (tunable)

      const facing = dx < THRESHOLD;

      return facing;
    } catch (err) {
      console.error("[useEyeDetection] Error in isFacingCamera:", err);
      return false;
    }
  }, []);

  /**
   * Register a frame with landmarks
   * Called every frame from face tracking hook
   */
  const registerFrame = useCallback(
    (landmarks) => {
      try {
        if (!landmarks || !Array.isArray(landmarks)) return;

        totalFramesRef.current += 1;
        const good = isFacingCamera(landmarks);

        if (good) {
          goodFramesRef.current += 1;
        }

        const percent =
          totalFramesRef.current > 0
            ? Math.round((goodFramesRef.current / totalFramesRef.current) * 100)
            : 0;

        setEyeContactPercent(percent);
        setIsGoodEyeContact(good);

        // Update statistics
        setEyeContactInfo((prev) => ({
          average: percent,
          max: Math.max(prev.max, percent),
          min: Math.min(prev.min, percent),
          samples: totalFramesRef.current,
        }));
      } catch (err) {
        console.error("[useEyeDetection] Error in registerFrame:", err);
      }
    },
    [isFacingCamera]
  );

  /**
   * Reset eye contact tracking
   */
  const resetEyeContact = useCallback(() => {
    console.log("[useEyeDetection] Resetting eye contact tracking");

    goodFramesRef.current = 0;
    totalFramesRef.current = 0;
    setEyeContactPercent(0);
    setIsGoodEyeContact(false);
    setEyeContactInfo({
      average: 0,
      max: 0,
      min: 100,
      samples: 0,
    });
  }, []);

  /**
   * Get summary of eye contact
   */
  const getEyeContactSummary = useCallback(() => {
    if (eyeContactPercent > 70) return "Excellent";
    if (eyeContactPercent > 50) return "Good";
    if (eyeContactPercent > 30) return "Fair";
    return "Poor";
  }, [eyeContactPercent]);

  return {
    eyeContactPercent,
    isGoodEyeContact,
    eyeContactInfo,
    registerFrame,
    resetEyeContact,
    getEyeContactSummary,
    rawEyeContactStats: {
      goodFramesRef,
      totalFramesRef,
    },
  };
}