// firebase/uploadVideo.js
import { storage } from "@/firebase/config";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

/**
 * Upload interview video to Firebase Storage
 * @param {Blob} blob - Video blob from MediaRecorder
 * @param {string} userId - User ID for file organization
 * @param {Function} onProgress - Callback(percent) for progress tracking
 * @returns {Promise<{filePath, downloadUrl}>}
 */
export async function uploadInterviewVideo(blob, userId, onProgress) {
  try {
    // Validate inputs
    if (!blob || !(blob instanceof Blob)) {
      throw new Error("Invalid blob provided for upload");
    }

    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid userId provided for upload");
    }

    console.log("[uploadInterviewVideo] Starting upload:", {
      blobSize: blob.size,
      blobType: blob.type,
      userId,
    });

    const timestamp = Date.now();
    const fileName = `interview_${userId}_${timestamp}.webm`;
    const filePath = `mock-interviews/${userId}/${fileName}`;
    const fileRef = storageRef(storage, filePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, blob);

      // Monitor upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const roundedProgress = Math.round(progress);

          console.log(
            `[uploadInterviewVideo] Upload progress: ${roundedProgress}%`
          );

          if (onProgress && typeof onProgress === "function") {
            onProgress(roundedProgress);
          }
        },
        (error) => {
          console.error("[uploadInterviewVideo] Upload failed:", error);
          reject(new Error(`Firebase upload error: ${error.message}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("[uploadInterviewVideo] Upload successful:", {
              filePath,
              downloadUrlLength: downloadUrl.length,
            });

            resolve({
              filePath,
              downloadUrl,
              fileName,
              uploadedAt: new Date().toISOString(),
            });
          } catch (err) {
            console.error(
              "[uploadInterviewVideo] Error getting download URL:",
              err
            );
            reject(new Error(`Failed to get download URL: ${err.message}`));
          }
        }
      );
    });
  } catch (error) {
    console.error("[uploadInterviewVideo] Error:", error);
    throw error;
  }
}