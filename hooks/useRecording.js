// hooks/useRecording.js
import { useCallback, useEffect, useRef, useState } from "react";

export default function useRecording() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopResolveRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingEndTime, setRecordingEndTime] = useState(null);
  const [recordingError, setRecordingError] = useState(null);

  const startRecording = useCallback((stream) => {
    try {
      setRecordingError(null);

      // Validate stream
      if (!stream) {
        const err = "No media stream provided for recording";
        console.error("[useRecording] Error:", err);
        setRecordingError(err);
        return;
      }

      if (typeof MediaRecorder === "undefined") {
        const err = "MediaRecorder not supported in this browser";
        console.error("[useRecording] Error:", err);
        setRecordingError(err);
        return;
      }

      console.log("[useRecording] Starting recording with stream:", {
        streamId: stream.id,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      chunksRef.current = [];

      // Create recorder with video/webm codec
      const options = {
        mimeType: "video/webm;codecs=vp8,opus",
      };

      // Fallback to default if codec not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn(
          `[useRecording] Codec ${options.mimeType} not supported, using default`
        );
        delete options.mimeType;
      }

      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(
            `[useRecording] Data chunk received: ${event.data.size} bytes`
          );
        }
      };

      recorder.onerror = (event) => {
        console.error("[useRecording] Recorder error:", event.error);
        setRecordingError(event.error);
      };

      recorder.onstop = () => {
        console.log(
          "[useRecording] Recording stopped, creating blob from",
          chunksRef.current.length,
          "chunks"
        );

        const blob = new Blob(chunksRef.current, {
          type: "video/webm",
        });

        console.log("[useRecording] Blob created:", {
          size: blob.size,
          type: blob.type,
        });

        setRecordedBlob(blob);
        setRecordingEndTime(new Date());
        setIsRecording(false);

        // Resolve the stopRecording promise
        if (stopResolveRef.current) {
          stopResolveRef.current(blob);
          stopResolveRef.current = null;
        }
      };

      recorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = recorder;
      setRecordingStartTime(new Date());
      setIsRecording(true);
      setRecordedBlob(null);

      console.log("[useRecording] Recording started successfully");
    } catch (error) {
      console.error("[useRecording] Error starting recording:", error);
      setRecordingError(error.message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log("[useRecording] Stop recording requested");

    if (!mediaRecorderRef.current) {
      console.warn("[useRecording] No recorder found");
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      stopResolveRef.current = resolve;

      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
          console.log("[useRecording] Stop signal sent to recorder");
        } else {
          console.warn("[useRecording] Recorder already inactive");
          resolve(recordedBlob || null);
        }
      } catch (error) {
        console.error("[useRecording] Error stopping recorder:", error);
        resolve(null);
      }
    });
  }, [recordedBlob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[useRecording] Cleaning up on unmount");

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error("[useRecording] Error during cleanup:", e);
        }
      }
    };
  }, []);

  return {
    isRecording,
    recordedBlob,
    recordingStartTime,
    recordingEndTime,
    recordingError,
    startRecording,
    stopRecording,
  };
}