// pages/candidate/aptitude-test.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";

// You can replace this with the same questions/config used in the mock test
const QUESTIONS = [
  {
    id: 1,
    question: "If 3x + 5 = 20, what is x?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1, // 4
  },
  {
    id: 2,
    question: "What is the next number in the series: 2, 4, 8, 16, ?",
    options: ["20", "24", "30", "32"],
    correctIndex: 3, // 32
  },
  {
    id: 3,
    question: "Which of the following is an even prime number?",
    options: ["1", "2", "3", "5"],
    correctIndex: 1,
  },
  {
    id: 4,
    question: "If a train travels 120 km in 2 hours, its speed is:",
    options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"],
    correctIndex: 2,
  },
  {
    id: 5,
    question: "What is 15% of 200?",
    options: ["20", "25", "30", "35"],
    correctIndex: 2,
  },
];

function AptitudeTestPage() {
  const router = useRouter();
  const { applicationId } = router.query;

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    // basic guard
    if (!applicationId) return;
  }, [applicationId]);

  const handleOptionChange = (qId, index) => {
    setAnswers((prev) => ({ ...prev, [qId]: index }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!applicationId) {
      alert("Missing application ID. Please go back and try again.");
      return;
    }

    // simple scoring: +20 for each correct answer (out of 100)
    let correct = 0;
    QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct += 1;
    });
    const finalScore = Math.round((correct / QUESTIONS.length) * 100);

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/jobs/applications/${applicationId}/aptitude-score`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: finalScore }),
        }
      );

      if (res.status === 401) {
        alert("Session expired. Please log in again.");
        if (typeof window !== "undefined") {
          window.location.href = "/login?role=candidate";
        }
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to save test score");
      }

      setScore(finalScore);
      setSubmitted(true);
      alert("Aptitude test submitted successfully!");
    } catch (err) {
      alert(err.message || "Something went wrong while submitting the test.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToApplications = () => {
    router.push("/candidate/job-profiles?tab=APPS");
  };

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Round 2 – Aptitude Test
        </h1>
        <p className="text-gray-600 mt-2">
          This is your actual assessment for the shortlisted role. Your score
          will be shared with the recruiter.
        </p>
      </div>

      {!applicationId && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          Invalid or missing application. Please go back to{" "}
          <button
            onClick={handleBackToApplications}
            className="underline font-semibold"
          >
            My Applications
          </button>
          .
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-6"
      >
        {QUESTIONS.map((q, idx) => (
          <div
            key={q.id}
            className="border border-gray-100 rounded-lg p-4 hover:border-indigo-100"
          >
            <div className="flex items-start gap-2 mb-3">
              <span className="text-sm font-semibold text-indigo-600">
                Q{idx + 1}.
              </span>
              <p className="text-gray-900 font-medium">{q.question}</p>
            </div>
            <div className="grid gap-2">
              {q.options.map((opt, i) => {
                const checked = answers[q.id] === i;
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm ${
                      checked
                        ? "bg-indigo-50 border border-indigo-300"
                        : "bg-gray-50 border border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => handleOptionChange(q.id, i)}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleBackToApplications}
            className="btn ghost"
            disabled={submitting}
          >
            Back to My Applications
          </button>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      </form>

      {submitted && (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">
            Your test score: <span className="text-lg">{score}</span>/100
          </p>
          <p className="text-sm mt-1">
            The recruiter can now view your aptitude score and decide on the
            next round.
          </p>
        </div>
      )}
    </div>
  );
}

AptitudeTestPage.getLayout = (page) => (
  <Layout role="CANDIDATE" active="mock-test">
    {page}
  </Layout>
);

export default AptitudeTestPage;
