// pages/recruiter/video-interview/[jobId]/editor.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../../components/Layout";

const DEFAULT_INTRO =
  "Welcome to the AI video interview. Please answer each question clearly and confidently.";
const DEFAULT_OUTRO =
  "Thank you for completing the interview. Our team will review your responses and get back to you soon.";

const emptyQuestion = (index) => ({
  id: String(index + 1),
  text: "",
  suggestedDuration: 90, // seconds per question
  focus: "", // e.g. "Problem solving", "Communication"
});

export default function VideoInterviewEditor() {
  const router = useRouter();
  const { jobId } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [outro, setOutro] = useState(DEFAULT_OUTRO);
  const [questions, setQuestions] = useState([emptyQuestion(0)]);
  const [durationMinutes, setDurationMinutes] = useState(15);

  // Load existing config (if any)
  useEffect(() => {
    if (!jobId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/interview/job/${encodeURIComponent(jobId)}`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load config");
        }

        if (data.job) setJob(data.job);

        if (data.config) {
          const cfg = data.config;

          if (cfg.intro) setIntro(cfg.intro);
          if (cfg.outro) setOutro(cfg.outro);
          if (cfg.durationMinutes)
            setDurationMinutes(Number(cfg.durationMinutes) || 15);

          if (Array.isArray(cfg.questions) && cfg.questions.length > 0) {
            setQuestions(
              cfg.questions.map((q, i) => ({
                id: q.id || String(i + 1),
                text: q.text || "",
                suggestedDuration:
                  Number(q.suggestedDurationSec) ||
                  Number(q.suggestedDuration) ||
                  90,
                focus: q.focus || "",
              }))
            );
          }
        }
      } catch (err) {
        console.error(err);
        alert(err.message || "Unable to load video interview config");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [jobId]);

  const updateQuestion = (index, updates) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length)]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => {
      if (prev.length === 1) return prev; // keep at least 1
      const next = prev.slice();
      next.splice(index, 1);
      return next.map((q, i) => ({ ...q, id: String(i + 1) }));
    });
  };

  const handleSave = async () => {
    if (!jobId) return;

    // Basic validation
    const cleanedQuestions = questions
      .map((q, i) => ({
        id: q.id || String(i + 1),
        text: (q.text || "").trim(),
        suggestedDuration: Number(q.suggestedDuration) || 90,
        focus: (q.focus || "").trim(),
      }))
      .filter((q) => q.text.length > 0);

    if (!cleanedQuestions.length) {
      alert("Please add at least one question before saving.");
      return;
    }

    if (!durationMinutes || durationMinutes <= 0) {
      alert("Please enter a valid total duration (in minutes).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        durationMinutes: Number(durationMinutes),
        intro,
        outro,
        questions: cleanedQuestions,
      };

      const res = await fetch(
        `/api/interview/job/${encodeURIComponent(jobId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to save config");
      }

      alert("Video interview configuration saved successfully.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save video interview config");
    } finally {
      setSaving(false);
    }
  };

  if (!jobId || loading) {
    return (
      <Layout role="RECRUITER" active="jobs">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-lg text-gray-600 font-medium">
            Loading video interview editor…
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="RECRUITER" active="jobs">
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI Video Interview – Configuration
            </h1>
            {job && (
              <p className="text-sm text-gray-600 mt-1">
                Job:{" "}
                <span className="font-semibold">
                  {job.title} · {job.companyName || job.company}
                </span>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Candidates shortlisted for Round 2 will see these questions in the
              AI video interview.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/recruiter/jobs")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              ← Back to Jobs
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-lg disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Interview"}
            </button>
          </div>
        </div>

        {/* Intro / Outro + total duration */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Total Duration (minutes)
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              Approximate total time allotted for this video interview.
            </p>
            <input
              type="number"
              min={5}
              max={60}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Introduction Script
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              This text is shown before the first question to brief the
              candidate.
            </p>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Closing Message
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              Shown after the last question is recorded.
            </p>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Interview Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100"
            >
              + Add Question
            </button>
          </div>

          <div className="space-y-5">
            {questions.map((q, index) => (
              <div
                key={q.id || index}
                className="border rounded-xl p-4 bg-gray-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    QUESTION {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    disabled={questions.length === 1}
                    className="text-xs text-red-500 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>

                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] bg-white"
                  placeholder="Type the interview question here..."
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(index, { text: e.target.value })
                  }
                />

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Suggested Answer Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={600}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      value={q.suggestedDuration}
                      onChange={(e) =>
                        updateQuestion(index, {
                          suggestedDuration: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Evaluation Focus (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="e.g. Communication, Problem-solving, Sales pitch"
                      value={q.focus}
                      onChange={(e) =>
                        updateQuestion(index, { focus: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
