// hooks/useCamera.js
import { useCallback, useEffect, useRef, useState } from "react";

export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      // Check browser support
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        const err = "Camera API not available in this environment";
        console.warn("[useCamera]", err);
        setCameraError(err);
        return null;
      }

      console.log("[useCamera] Requesting camera/microphone access");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("[useCamera] Stream obtained:", {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      streamRef.current = stream;
      setIsCameraOn(true);

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        const playVideo = async () => {
          try {
            await videoRef.current.play();
            console.log("[useCamera] Video playback started");
          } catch (err) {
            console.warn(
              "[useCamera] Video play blocked until user interaction:",
              err.message
            );
            // Video will autoplay once user interacts
          }
        };

        // Check if metadata is already loaded
        if (videoRef.current.readyState >= 2) {
          playVideo();
        } else {
          // Wait for metadata to load
          videoRef.current.onloadedmetadata = playVideo;
        }
      }

      return stream;
    } catch (error) {
      console.error("[useCamera] Error starting camera:", error);
      setCameraError(error.message);
      setIsCameraOn(false);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log("[useCamera] Stopping camera");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log(`[useCamera] Stopping ${track.kind} track`);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
    console.log("[useCamera] Camera stopped");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[useCamera] Cleaning up on unmount");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.error("[useCamera] Error stopping track:", e);
          }
        });
      }
    };
  }, []);

  return {
    videoRef,
    mediaStream: streamRef.current,
    isCameraOn,
    cameraError,
    startCamera,
    stopCamera,
  };
}