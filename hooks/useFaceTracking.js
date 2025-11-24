// hooks/useFaceTracking.js
import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

/**
 * Face Tracking Hook
 * Uses TensorFlow.js + MediaPipe Face Mesh to detect face landmarks
 * 
 * - Only runs in browser (guards against Next.js SSR)
 * - Loads model once on component mount
 * - Runs detection loop every frame when enabled
 * - Calls onLandmarks callback with 468-point landmark array
 */
export default function useFaceTracking(
  videoRef,
  { enabled = false, onLandmarks } = {}
) {
  const [faceDetected, setFaceDetected] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  const modelRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Load TensorFlow model
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        // Guard against SSR
        if (typeof window === "undefined") {
          console.log("[useFaceTracking] Skipping model load in SSR environment");
          return;
        }

        // Prevent multiple concurrent loads
        if (isLoadingRef.current) {
          console.log("[useFaceTracking] Model already loading, skipping duplicate load");
          return;
        }

        isLoadingRef.current = true;
        console.log("[useFaceTracking] Loading face landmarks model...");

        // Initialize TensorFlow backend
        await tf.setBackend("webgl");
        await tf.ready();
        console.log("[useFaceTracking] TensorFlow backend ready");

        // Load MediaPipe Face Mesh model
        const model = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
          {
            maxFaces: 1, // Only detect one face
          }
        );

        if (!isMounted) {
          console.log("[useFaceTracking] Component unmounted, discarding model");
          return;
        }

        modelRef.current = model;
        setIsModelReady(true);
        setTrackingError(null);
        console.log("✅ [useFaceTracking] Face landmarks model loaded successfully");
      } catch (err) {
        console.error("[useFaceTracking] Error loading model:", err);
        setTrackingError(err.message);
        setIsModelReady(false);
      } finally {
        isLoadingRef.current = false;
      }
    };

    if (enabled) {
      loadModel();
    }

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  // Run detection loop
  useEffect(() => {
    if (!enabled) {
      console.log("[useFaceTracking] Detection disabled");
      return;
    }

    if (typeof window === "undefined") {
      console.log("[useFaceTracking] Skipping detection in SSR environment");
      return;
    }

    let isCancelled = false;

    const detect = async () => {
      if (isCancelled) return;

      const videoEl = videoRef.current;
      const model = modelRef.current;

      // Guard conditions
      if (!videoEl) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      if (!model) {
        // Model still loading or failed to load
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      if (!isModelReady) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Wait for video metadata
      if (videoEl.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        // Run face detection
        const predictions = await model.estimateFaces({
          input: videoEl,
          returnTensors: false,
          flipHorizontal: false, // Video already visually flipped with CSS
          predictIrises: false,
        });

        if (predictions && predictions.length > 0) {
          setFaceDetected(true);
          const face = predictions[0];

          // Get landmarks (468 points for face mesh)
          const landmarks = face.scaledMesh || face.mesh || null;

          if (landmarks && onLandmarks && typeof onLandmarks === "function") {
            // Convert to array of [x, y, z] if needed
            onLandmarks(landmarks);
          }
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        // Errors are common during first frames, don't spam console
        if (err.message && !err.message.includes("decode")) {
          console.warn("[useFaceTracking] Detection error:", err.message);
        }
      }

      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    if (isModelReady) {
      console.log("[useFaceTracking] Starting detection loop");
      animationFrameRef.current = requestAnimationFrame(detect);
    }

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, isModelReady, videoRef, onLandmarks]);

  return {
    faceDetected,
    isModelReady,
    trackingError,
  };
}