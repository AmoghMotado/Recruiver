// pages/recruiter/aptitude/[jobId].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";

function emptyQuestion() {
  return {
    id: "",
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
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

function formatCategoryLabel(cat) {
  if (!cat) return "General";
  const c = cat.toLowerCase();
  if (c === "quant") return "Quantitative Aptitude";
  if (c === "logical") return "Logical Reasoning";
  if (c === "verbal") return "Verbal / Communication";
  if (c === "programming") return "Programming / Coding Concepts";
  return cat;
}

// Normalize arbitrary recruiter input into canonical category keys
function normalizeCategory(raw) {
  if (!raw) return "";
  const c = raw.trim().toLowerCase();

  if (c.startsWith("quant")) return "quant";
  if (c.startsWith("logical") || c.startsWith("reason")) return "logical";
  if (c.startsWith("verbal") || c.includes("communication")) return "verbal";
  if (c.startsWith("prog") || c.includes("coding") || c.includes("tech"))
    return "programming";

  // allow custom buckets if needed, but Round-2 UI will treat them as-is
  return raw.trim();
}

export default function AptitudeEditorPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

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
      if (field === "text" || field === "category" || field === "id") {
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
        return `Question ${i + 1} has an invalid correct option.`;
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
        // normalize for Round-2 analytics + candidate UI
        category: normalizeCategory(q.category),
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
  // Import from Mock Test
  // ---------------------------------------------------------------------------
  const handleImportFromMock = async () => {
    if (
      !window.confirm(
        "Import questions from the Mock Test bank? This will replace the current questions in this editor."
      )
    ) {
      return;
    }

    setImporting(true);
    setError("");
    setSuccess("");

    try {
      // Sync with mock test categories: quant, logical, verbal, programming
      const topics = [
        { key: "quant", label: "Quantitative Aptitude" },
        { key: "logical", label: "Logical Reasoning" },
        { key: "verbal", label: "Verbal / Communication" },
        { key: "programming", label: "Programming / Coding Concepts" },
      ];

      const perTopic = 10;
      const allQuestions = [];

      for (const { key, label } of topics) {
        const res = await fetch(
          `/api/mock/questions?topic=${encodeURIComponent(
            key
          )}&count=${perTopic}`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.message ||
              `Failed to fetch ${label} questions from mock test.`
          );
        }

        const qs = (data.questions || []).map((q, idx) => ({
          id: q.id || `${key}-${idx}`,
          text: q.q || "",
          options: q.options || ["", "", "", ""],
          correctIndex: typeof q.answer === "number" ? q.answer : 0,
          category: key, // already canonical
        }));

        allQuestions.push(...qs);
      }

      if (!allQuestions.length) {
        throw new Error("Mock test bank did not return any questions.");
      }

      setQuestions(allQuestions);
      setDurationMinutes(60);
      setIsDirty(true);
      setSuccess(
        "Imported questions from mock test. Review them and click Save Aptitude Test."
      );
    } catch (e) {
      console.error("Import from mock error:", e);
      setError(e.message || "Failed to import from mock test");
    } finally {
      setImporting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Preview
  // ---------------------------------------------------------------------------
  const handleOpenPreview = () => {
    if (!questions.length) return;
    setPreviewOpen(true);
  };

  const handleBack = () => {
    router.push("/recruiter/job-profiles");
  };

  const disableSave = saving || importing || !questions.length || !!validate();

  return (
    <DashboardLayout role="RECRUITER" active="job-profiles">
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Aptitude Test Editor
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure the Round 2 aptitude test for this job. Candidates
              shortlisted for this role will take this test under strict
              proctoring.
            </p>
            {jobMeta && (
              <p className="text-sm text-indigo-700 mt-2 font-medium">
                {jobMeta.title} · {jobMeta.company}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                  Unsaved changes
                </span>
              )}
              {lastSavedAt && !isDirty && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  Saved · {formatTime(lastSavedAt)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Back to Job Profiles
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {!loading && (error || success) && (
          <div className="space-y-2">
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

        {/* Main Editor Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          {loading ? (
            <div className="py-8 text-sm text-gray-500">
              Loading aptitude config...
            </div>
          ) : (
            <>
              {/* Top controls row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Default is 60 minutes. Set according to difficulty.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportFromMock}
                    disabled={importing || saving}
                    className="px-4 py-2 rounded-full border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {importing ? "Importing..." : "Duplicate from Mock Test"}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    disabled={!questions.length}
                    className="px-4 py-2 rounded-full border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Preview Test
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={disableSave}
                    className="inline-flex items-center px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Aptitude Test"}
                  </button>
                </div>
              </div>

              {/* Questions */}
              <div className="flex items-center justify-between mt-4">
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Questions ({questions.length})
                </h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="border border-gray-100 rounded-2xl p-4 bg-gray-50/70"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Question {index + 1}
                        </p>
                        {q.category && (
                          <p className="text-[11px] text-indigo-600 mt-0.5">
                            {formatCategoryLabel(normalizeCategory(q.category))}
                          </p>
                        )}
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
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      rows={3}
                      placeholder="Enter question text..."
                      value={q.text}
                      onChange={(e) =>
                        updateQuestionField(index, "text", e.target.value)
                      }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {(q.options || ["", "", "", ""]).map(
                        (opt, optIdx) => (
                          <div
                            key={optIdx}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => setCorrectIndex(index, optIdx)}
                              className="h-4 w-4 text-indigo-600 border-gray-300"
                            />
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) =>
                                updateOption(index, optIdx, e.target.value)
                              }
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Category (optional)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          placeholder="e.g. Quant, Logical, Verbal, Programming"
                          value={q.category}
                          onChange={(e) =>
                            updateQuestionField(
                              index,
                              "category",
                              e.target.value
                            )
                          }
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                          Tip: use <strong>Quant</strong>,{" "}
                          <strong>Logical</strong>, <strong>Verbal</strong>, or{" "}
                          <strong>Programming</strong> for best analytics.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Preview Overlay */}
        {previewOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Aptitude Test – Preview
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    This is how the candidate will see the questions (minus
                    timer &amp; AI proctoring).
                  </p>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Duration: {Number(durationMinutes) || 60} minutes ·{" "}
                  {questions.length} questions
                </span>
                {jobMeta && (
                  <span>
                    {jobMeta.title} · {jobMeta.company}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {idx + 1}.{" "}
                        {q.text || (
                          <span className="italic text-gray-400">
                            [No text]
                          </span>
                        )}
                      </p>
                      {q.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-200">
                          {formatCategoryLabel(
                            normalizeCategory(q.category)
                          )}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 mt-2">
                      {(q.options || []).map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="flex items-center gap-2 text-sm text-gray-700"
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
                      ))}
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
