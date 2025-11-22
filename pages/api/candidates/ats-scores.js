// ============================================
// FILE 1: pages/api/candidates/ats-scores.js (CREATE NEW)
// ============================================
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed", success: false });
  }

  try {
    const scoresRef = collection(db, "candidateATSScores");
    const q = query(scoresRef, orderBy("lastUpdated", "desc"));
    const querySnapshot = await getDocs(q);

    const scores = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      scores[data.candidateEmail] = {
        generalScore: data.generalScore || 0,
        jdMatchScore: data.jdMatchScore || 0,
        overallScore: data.overallScore || 0,
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
      };
    });

    return res.status(200).json({
      scores,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching ATS scores:", error);
    return res.status(500).json({
      message: "Failed to fetch ATS scores",
      error: error.message,
      success: false,
    });
  }
}