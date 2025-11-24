// pages/recruiter/jobs/[jobId]/video-interview.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

const CATEGORIES = [
  { value: "general", label: "General / Intro" },
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "culture", label: "Culture Fit" },
  { value: "other", label: "Other" },
];

function VideoInterviewEditor() {
  const router = useRouter();
  const { jobId } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState([
    { id: "q1", text: "", category: "general", suggestedDurationSec: 90 },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/interview/job/${jobId}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to load interview config");
        }

        if (cancelled) return;

        setJob(data.job || null);
        if (data.config) {
          setDuration(data.config.durationMinutes || 15);
          const qs = (data.config.questions || []).map((q, idx) => ({
            id: q.id || `q${idx + 1}`,
            text: q.text || "",
            category: q.category || "general",
            suggestedDurationSec: q.suggestedDurationSec || 90,
          }));
          setQuestions(qs.length ? qs : questions);
        } else {
          // fresh config
          setDuration(15);
          setQuestions([
            {
              id: "q1",
              text:
                "Tell us about yourself and why you are interested in this role.",
              category: "general",
              suggestedDurationSec: 90,
            },
            {
              id: "q2",
              text:
                "Describe a challenging project you worked on and how you contributed.",
              category: "behavioral",
              suggestedDurationSec: 120,
            },
          ]);
        }
      } catch (e) {
        console.error("Video interview load error:", e);
        if (!cancelled) setError(e.message || "Failed to load config");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q${prev.length + 1}`,
        text: "",
        category: "general",
        suggestedDurationSec: 90,
      },
    ]);
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx, dir) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= copy.length) return prev;
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const handleSave = async () => {
    if (!jobId) return;
    setSaving(true);
    setError("");
    try {
      const cleaned = questions
        .map((q, idx) => ({
          id: q.id || `q${idx + 1}`,
          text: q.text.trim(),
          category: q.category || "general",
          suggestedDurationSec:
            Number(q.suggestedDurationSec) > 0
              ? Number(q.suggestedDurationSec)
              : 90,
        }))
        .filter((q) => q.text.length);

      if (!cleaned.length) {
        throw new Error("Please add at least one interview question.");
      }

      const res = await fetch(`/api/interview/job/${jobId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: Number(duration) || 15,
          questions: cleaned,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save video interview config");
      }

      alert("Video interview configuration saved.");
    } catch (e) {
      console.error("Video interview save error:", e);
      setError(e.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/recruiter/dashboard");
  };

  return (
    <Layout role="RECRUITER" active="jobs">
      <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              Round 2 · AI Video Interview
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Video Interview Editor
            </h1>
            {job && (
              <p className="text-sm text-gray-600 mt-1">
                Configuring for{" "}
                <span className="font-semibold">
                  {job.title} @ {job.company}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to Jobs
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Interview Overview
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                These are one-way recorded answers evaluated by AI. Candidates
                will see each question one by one with a camera preview, just
                like your mock AI interview.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total duration (minutes)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-32 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This controls the high-level timer the candidate sees.
              </p>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-900">
              <h3 className="font-semibold mb-2">Best practices</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>3–5 questions is usually ideal.</li>
                <li>Keep each answer under 2 minutes.</li>
                <li>Mix general, behavioral and role-specific questions.</li>
                <li>
                  Avoid confidential / identifying questions – this is recorded.
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Interview Questions
              </h2>
              <button
                onClick={addQuestion}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Question {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, -1)}
                        disabled={idx === 0}
                        className="px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, 1)}
                        disabled={idx === questions.length - 1}
                        className="px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        disabled={questions.length === 1}
                        className="px-2 py-1 text-xs rounded-lg border border-red-200 text-red-600 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(idx, { text: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Enter the question the candidate should answer on video…"
                  />

                  <div className="mt-3 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={q.category || "general"}
                        onChange={(e) =>
                          updateQuestion(idx, { category: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Suggested answer duration (seconds)
                      </label>
                      <input
                        type="number"
                        min={30}
                        max={300}
                        value={q.suggestedDurationSec}
                        onChange={(e) =>
                          updateQuestion(idx, {
                            suggestedDurationSec: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Candidates in <span className="font-semibold">Stage 2</span>{" "}
                for this job will see these questions as their{" "}
                <span className="font-semibold">Round 2 – AI Video Interview</span>.
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Interview"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

VideoInterviewEditor.getLayout = (page) => (
  <Layout role="RECRUITER" active="jobs">
    {page}
  </Layout>
);

export default VideoInterviewEditor;
