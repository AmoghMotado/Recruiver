// pages/recruiter/aptitude/[jobId].js
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";

function emptyQuestion() {
  return {
    id: "",
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    // kept for backward compatibility, but not shown in UI
    category: "",
  };
}

function formatTime(date) {
  if (!date) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AptitudeEditorPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [jobMeta, setJobMeta] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Load existing config
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    const fetchConfig = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const res = await fetch(`/api/aptitude/job/${jobId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load aptitude config");
        }
        const data = await res.json();

        if (cancelled) return;

        setJobMeta(data.job || null);

        if (data.test) {
          setDurationMinutes(data.test.durationMinutes || 60);
          if (Array.isArray(data.test.questions) && data.test.questions.length) {
            setQuestions(
              data.test.questions.map((q) => ({
                id: q.id || "",
                text: q.text || "",
                options: Array.isArray(q.options)
                  ? [...q.options]
                  : ["", "", "", ""],
                correctIndex:
                  typeof q.correctIndex === "number" ? q.correctIndex : 0,
                category: q.category || "",
              }))
            );
          } else {
            setQuestions([emptyQuestion()]);
          }
          setLastSavedAt(new Date());
        } else {
          setDurationMinutes(60);
          setQuestions([emptyQuestion()]);
        }

        setIsDirty(false);
      } catch (e) {
        console.error("Aptitude editor load error:", e);
        if (!cancelled) {
          setError(e.message || "Failed to load aptitude test");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConfig();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  // ---------------------------------------------------------------------------
  // Local updates
  // ---------------------------------------------------------------------------
  const markDirty = () => {
    setIsDirty(true);
    setSuccess("");
  };

  const updateQuestionField = (index, field, value) => {
    markDirty();
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[index] };
      if (field === "text" || field === "id") {
        q[field] = value;
      }
      copy[index] = q;
      return copy;
    });
  };

  const updateOption = (qIndex, optIndex, value) => {
    markDirty();
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      const opts = [...(q.options || [])];
      while (opts.length < 4) opts.push("");
      opts[optIndex] = value;
      q.options = opts;
      copy[qIndex] = q;
      return copy;
    });
  };

  const setCorrectIndex = (qIndex, idx) => {
    markDirty();
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      q.correctIndex = idx;
      copy[qIndex] = q;
      return copy;
    });
  };

  const addQuestion = () => {
    markDirty();
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    markDirty();
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDurationChange = (value) => {
    markDirty();
    setDurationMinutes(value);
  };

  // ---------------------------------------------------------------------------
  // Validation & Save
  // ---------------------------------------------------------------------------
  const validate = () => {
    if (!questions.length) return "Please add at least one question.";

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.text || !q.text.trim()) {
        return `Question ${i + 1} is missing text.`;
      }
      const options = (q.options || []).map((o) => (o || "").trim());
      const nonEmpty = options.filter(Boolean);
      if (nonEmpty.length < 2) {
        return `Question ${i + 1} must have at least 2 options.`;
      }
      if (
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 ||
        q.correctIndex >= options.length ||
        !options[q.correctIndex]
      ) {
        return `Question ${i + 1} must have a valid correct answer selected.`;
      }
    }
    return "";
  };

  const handleSave = async () => {
    if (!jobId) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      durationMinutes: Number(durationMinutes) || 60,
      questions: questions.map((q, idx) => ({
        id: q.id || `q${idx + 1}`,
        text: q.text,
        options: (q.options || []).slice(0, 4),
        correctIndex: q.correctIndex,
        category: q.category || "",
      })),
    };

    try {
      const res = await fetch(`/api/aptitude/job/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save aptitude test");
      }

      const now = new Date();
      setLastSavedAt(now);
      setIsDirty(false);
      setSuccess("Aptitude test saved successfully.");
    } catch (e) {
      console.error("Aptitude save error:", e);
      setError(e.message || "Failed to save aptitude test");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Preview
  // ---------------------------------------------------------------------------
  const handleOpenPreview = () => {
    if (!questions.length) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }
    setPreviewOpen(true);
  };

  const handleBack = () => {
    router.push("/recruiter/job-profiles");
  };

  const disableSave = saving || !questions.length || !!validate();
  const canPreview = useMemo(
    () => !loading && questions.length > 0 && !validate(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, questions, durationMinutes]
  );

  return (
    <DashboardLayout role="RECRUITER" active="job-profiles">
      {/* reduced horizontal padding & more vertical breathing room */}
      <div className="max-w-7xl mx-auto py-10 px-2 md:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Round 2 · Aptitude Test
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
              Aptitude Test Editor
            </h1>
            <p className="text-base text-gray-500 max-w-3xl leading-relaxed">
              Design a structured, auto-graded aptitude test for this role.
              Candidates shortlisted from Round 1 will take this test under
              AI-based proctoring.
            </p>
            {jobMeta && (
              <div className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                <span className="truncate">
                  {jobMeta.title} · {jobMeta.company}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                  Unsaved changes
                </span>
              )}
              {lastSavedAt && !isDirty && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  Saved · {formatTime(lastSavedAt)}
                </span>
              )}
            </div>
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Back to Job Profiles
            </button>
          </div>
        </div>

        {/* Alerts */}
        {!loading && (error || success) && (
          <div className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl px-4 py-3">
                {success}
              </div>
            )}
          </div>
        )}

        {/* Main layout: left editor, right summary */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.6fr)_minmax(0,1.2fr)] gap-6 items-start">
          {/* Left: Question editor */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            {loading ? (
              <div className="py-20 text-base text-gray-500 text-center">
                Loading aptitude config...
              </div>
            ) : (
              <>
                {/* Duration + primary actions */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-1.5">
                        Test Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={durationMinutes}
                        onChange={(e) =>
                          handleDurationChange(e.target.value)
                        }
                        className="w-44 px-4 py-3 rounded-xl border border-gray-200 text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-400 mt-1.5">
                        Default is 60 minutes. Adjust based on difficulty.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenPreview}
                      disabled={!canPreview}
                      className="px-5 py-2.5 rounded-full border border-indigo-200 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Preview Candidate View
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={disableSave}
                      className="inline-flex items-center px-7 py-3 rounded-full bg-indigo-600 text-white text-sm md:text-base font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Aptitude Test"}
                    </button>
                  </div>
                </div>

                {/* Questions header */}
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-[0.22em]">
                      Questions
                    </h2>
                    <p className="text-sm md:text-base text-gray-500">
                      {questions.length} question
                      {questions.length !== 1 ? "s" : ""} configured
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex items-center px-5 py-2.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100"
                  >
                    + Add Question
                  </button>
                </div>

                {/* Questions list */}
                <div className="space-y-5 max-h-[700px] overflow-y-auto pr-1">
                  {questions.map((q, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-6 bg-gray-50/70"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-semibold">
                            {index + 1}
                          </span>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Question {index + 1}
                            </p>
                            <p className="text-[12px] text-gray-400">
                              Mark one option as the correct answer. This will
                              be used for auto-scoring.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          disabled={questions.length === 1}
                          className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>

                      <textarea
                        className="w-full text-base md:text-lg border border-gray-200 rounded-2xl px-4 py-3.5 mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        rows={3}
                        placeholder="Type the question here..."
                        value={q.text}
                        onChange={(e) =>
                          updateQuestionField(index, "text", e.target.value)
                        }
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {(q.options || ["", "", "", ""]).map(
                          (opt, optIdx) => {
                            const isCorrect = q.correctIndex === optIdx;
                            const optionLabel =
                              ["A", "B", "C", "D"][optIdx] || "";
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => setCorrectIndex(index, optIdx)}
                                className={`flex items-center gap-3 w-full text-left rounded-2xl border px-4 py-3.5 transition ${
                                  isCorrect
                                    ? "border-emerald-500 bg-emerald-50/70 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                                }`}
                              >
                                <div className="flex items-center justify-center">
                                  <span
                                    className={`h-6 w-6 rounded-full border flex items-center justify-center text-[11px] font-semibold ${
                                      isCorrect
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-gray-300 text-gray-400 bg-white"
                                    }`}
                                  >
                                    {optionLabel}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent border-0 p-0 text-sm md:text-base focus:outline-none focus:ring-0"
                                    placeholder={`Option ${optIdx + 1}`}
                                    value={opt}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      updateOption(
                                        index,
                                        optIdx,
                                        e.target.value
                                      )
                                    }
                                  />
                                  {isCorrect && (
                                    <p className="text-[11px] md:text-xs text-emerald-700 mt-0.5 font-medium">
                                      Marked as correct answer
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Summary / helper panel */}
          <aside className="space-y-4 md:space-y-5">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 rounded-3xl text-white p-5 md:p-6 shadow-sm">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100/90">
                Overview
              </p>
              <h2 className="mt-2 text-lg md:text-xl font-semibold">
                Test configuration
              </h2>
              <p className="mt-2 text-xs md:text-sm text-indigo-100/90 leading-relaxed">
                This aptitude test will be auto-graded based on the correct
                options you select for each question.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/10 rounded-2xl px-3 py-2.5">
                  <p className="text-[11px] text-indigo-100/90">Duration</p>
                  <p className="text-sm md:text-base font-semibold">
                    {Number(durationMinutes) || 60} min
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl px-3 py-2.5">
                  <p className="text-[11px] text-indigo-100/90">
                    Total questions
                  </p>
                  <p className="text-sm md:text-base font-semibold">
                    {questions.length}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs md:text-sm text-indigo-100/90">
                <li>• Each question supports up to 4 options.</li>
                <li>• Select exactly one correct answer per question.</li>
                <li>• Candidates will see one clean MCQ interface.</li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 shadow-sm space-y-3 text-sm text-gray-700">
              <h3 className="text-base font-semibold text-gray-900">
                Best practices
              </h3>
              <ul className="space-y-2 text-xs md:text-sm text-gray-500">
                <li>• Keep questions unambiguous and role-relevant.</li>
                <li>• Balance difficulty across the entire test.</li>
                <li>• Use all four options whenever possible.</li>
                <li>• Review the Preview before publishing to candidates.</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Preview Overlay */}
        {previewOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-2">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
              <div className="px-6 md:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Candidate View – Aptitude Test
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                    This is how the candidate will see the MCQs. Correct answers
                    are highlighted only for you as the recruiter.
                  </p>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="px-6 md:px-8 py-3 border-b border-gray-100 flex items-center justify-between text-xs md:text-sm text-gray-500">
                <span>
                  Duration: {Number(durationMinutes) || 60} minutes ·{" "}
                  {questions.length} question
                  {questions.length !== 1 ? "s" : ""}
                </span>
                {jobMeta && (
                  <span className="truncate">
                    {jobMeta.title} · {jobMeta.company}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 md:px-8 py-4 space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-2xl p-4 md:p-5 bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm md:text-base font-medium text-gray-900">
                        {idx + 1}.{" "}
                        {q.text || (
                          <span className="italic text-gray-400">
                            [No text]
                          </span>
                        )}
                      </p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] md:text-xs font-semibold border border-emerald-200">
                        Correct:{" "}
                        {["A", "B", "C", "D"][q.correctIndex] || "Not set"}
                      </span>
                    </div>
                    <div className="space-y-2 mt-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 text-sm md:text-base px-3 py-2.5 rounded-2xl border ${
                              isCorrect
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <span className="h-4 w-4 rounded-full border border-gray-300 bg-white" />
                            <span>
                              {opt || (
                                <span className="italic text-gray-400">
                                  [empty option]
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
