// lib/uploadVideo.js
// Uploads an interview recording through a signed URL issued by our API,
// so Cloud Storage never has to be writable from the browser.

/**
 * @param {Blob} blob - Video blob from MediaRecorder
 * @param {string} interviewId - Interview session the recording belongs to
 * @param {Function} onProgress - Callback(percent) for progress tracking
 * @returns {Promise<{filePath: string}>}
 */
export async function uploadInterviewVideo(blob, interviewId, onProgress) {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error("No recording to upload");
  }

  const contentType = (blob.type || "video/webm").split(";")[0];

  const res = await fetch("/api/mock-interview/upload-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId, contentType, size: blob.size }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not prepare the upload");
  }

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.uploadUrl);
    xhr.setRequestHeader("Content-Type", data.contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(blob);
  });

  return { filePath: data.filePath };
}
