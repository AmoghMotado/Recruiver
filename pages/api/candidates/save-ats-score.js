// ============================================
// FILE 2: pages/api/candidates/save-ats-score.js (CREATE NEW)
// ============================================
import { db, Timestamp } from "@/lib/firebase";
import { collection, setDoc, doc } from "firebase/firestore";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed", success: false });
  }

  try {
    const { candidateEmail, candidateName, generalScore, jdMatchScore } = req.body;

    // Validate input
    if (!candidateEmail || !candidateName) {
      return res.status(400).json({
        message: "Candidate email and name are required",
        success: false,
      });
    }

    const general = parseFloat(generalScore) || 0;
    const jdMatch = parseFloat(jdMatchScore) || 0;
    const overall = (general + jdMatch) / 2;

    console.log("Saving ATS score for:", candidateEmail, {
      generalScore: general,
      jdMatchScore: jdMatch,
      overallScore: overall,
    });

    // Save to Firestore
    const scoresRef = collection(db, "candidateATSScores");
    await setDoc(doc(scoresRef, candidateEmail), {
      candidateEmail,
      candidateName,
      generalScore: general,
      jdMatchScore: jdMatch,
      overallScore: overall,
      lastUpdated: Timestamp.now(),
    });

    console.log("✅ ATS score saved successfully");

    return res.status(200).json({
      message: "ATS score saved successfully",
      score: {
        generalScore: general,
        jdMatchScore: jdMatch,
        overallScore: overall,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error saving ATS score:", error);
    return res.status(500).json({
      message: "Failed to save ATS score",
      error: error.message,
      success: false,
    });
  }
}