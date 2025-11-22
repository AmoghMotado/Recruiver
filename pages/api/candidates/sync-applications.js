// ============================================
// FILE 2: pages/api/candidates/sync-applications.js (NEW)
// ============================================
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc, query, where } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get all applications from candidates collection
    const applicationsRef = collection(db, "candidates");
    const applicationsSnapshot = await getDocs(applicationsRef);

    const syncedApplications = [];

    // Iterate through all candidates and their applications
    applicationsSnapshot.forEach(async (candidateDoc) => {
      const candidateData = candidateDoc.data();
      const candidateEmail = candidateData.email;

      // Check if candidate has applications
      if (candidateData.applications && Array.isArray(candidateData.applications)) {
        candidateData.applications.forEach((app) => {
          syncedApplications.push({
            candidateId: candidateDoc.id,
            candidateEmail,
            candidateName: candidateData.name,
            jobId: app.jobId,
            jobTitle: app.jobTitle,
            appliedAt: app.appliedAt,
            status: app.status || "Applied",
          });
        });
      }
    });

    return res.status(200).json({
      applications: syncedApplications,
      count: syncedApplications.length,
      success: true,
    });
  } catch (error) {
    console.error("Error syncing applications:", error);
    return res.status(500).json({
      message: "Failed to sync applications",
      error: error.message,
      success: false,
    });
  }
}