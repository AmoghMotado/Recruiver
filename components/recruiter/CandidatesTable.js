import { useState } from "react";
import HrModal from "./HrModal";

export default function CandidatesTable({
  rows,
  loading,
  selectedIds,
  onToggle,
  onToggleAll,
  onViewResume,
  atsScores,
  onRefresh,
}) {
  const [generatingATS, setGeneratingATS] = useState({});
  const [atsResults, setAtsResults] = useState({});
  const [hrModalOpen, setHrModalOpen] = useState(false);
  const [hrApplication, setHrApplication] = useState(null);

  const handleGenerateATS = async (candidate) => {
    if (!candidate.applicationId || !candidate.resumePath) {
      alert("Missing application ID or resume path for this candidate.");
      return;
    }

    setGeneratingATS((prev) => ({
      ...prev,
      [candidate.applicationId]: true,
    }));

    try {
      const res = await fetch("/api/candidates/generate-ats-score", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: candidate.applicationId,
          resumePath: candidate.resumePath,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate ATS score");
      }

      setAtsResults((prev) => ({
        ...prev,
        [candidate.applicationId]: data.score,
      }));
      onRefresh?.();
    } catch (err) {
      console.error("Generate ATS error:", err);
      alert(err.message || "Failed to generate ATS score");
    } finally {
      setGeneratingATS((prev) => ({
        ...prev,
        [candidate.applicationId]: false,
      }));
    }
  };

  const callAdvance = async (applicationId, body) => {
    const res = await fetch(`/api/jobs/applications/${applicationId}/advance`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Failed to update application");
    }
    onRefresh?.();
    return data.application;
  };

  // 🔹 Primary pipeline action for a single row
  const handlePrimaryAction = async (row) => {
    const stage = typeof row.stage === "number" ? row.stage : 0;
    const aptitudeScore =
      typeof row.aptitudeScore === "number" ? row.aptitudeScore : null;
    const videoScore =
      typeof row.videoInterviewScore === "number"
        ? row.videoInterviewScore
        : null;

    try {
      if (stage <= 0) {
        // Stage 0 – ATS -> shortlist to aptitude
        await callAdvance(row.applicationId, { action: "SHORTLIST_ROUND1" });
      } else if (
        // ✅ Stage 2+ and aptitude done, but video not done yet → invite Round 2
        stage >= 2 &&
        aptitudeScore !== null &&
        !videoScore &&
        row.status !== "SHORTLISTED"
      ) {
        await callAdvance(row.applicationId, { action: "SHORTLIST_ROUND2" });
      } else if (
        // Stage 2 – video done → open HR modal
        stage === 2 &&
        videoScore !== null &&
        row.status !== "HR_SCHEDULED" &&
        row.status !== "REJECTED"
      ) {
        setHrApplication(row);
        setHrModalOpen(true);
      }
    } catch (err) {
      console.error("Advance error:", err);
      alert(err.message || "Failed to update pipeline stage");
    }
  };

  const handleReject = async (row) => {
    try {
      await callAdvance(row.applicationId, { action: "REJECT" });
    } catch (err) {
      console.error("Reject error:", err);
      alert(err.message || "Failed to reject candidate");
    }
  };

  const handleHrConfirm = async (details) => {
    if (!hrApplication) return;
    try {
      await callAdvance(hrApplication.applicationId, {
        action: "SELECT_HR",
        ...details,
      });
      setHrApplication(null);
      setHrModalOpen(false);
    } catch (err) {
      console.error("HR select error:", err);
      alert(err.message || "Failed to schedule HR round");
    }
  };

  const getATSBadge = (score) => {
    if (score >= 80)
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 40) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getScoreBadge = (score) => {
    if (score === null || typeof score !== "number") return "";
    if (score >= 80)
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (score >= 60) return "bg-blue-50 text-blue-800 border-blue-200";
    if (score >= 40) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-red-50 text-red-800 border-red-200";
  };

  const getRecommendationBadge = (rec) => {
    const base =
      "inline-flex px-2 py-1 text-[11px] font-semibold rounded-full capitalize";
    if (rec === "STRONG_FIT") return `${base} bg-emerald-100 text-emerald-800`;
    if (rec === "GOOD_FIT") return `${base} bg-blue-100 text-blue-800`;
    if (rec === "MODERATE_FIT")
      return `${base} bg-amber-100 text-amber-800`;
    if (rec === "WEAK_FIT") return `${base} bg-red-100 text-red-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  const getStatusBadge = (status) => {
    const base =
      "inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize";
    if (status === "APPLIED")
      return `${base} bg-blue-100 text-blue-800 border border-blue-200`;
    if (status === "UNDER_REVIEW")
      return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
    if (status === "SHORTLISTED")
      return `${base} bg-emerald-100 text-emerald-800 border border-emerald-200`;
    if (status === "HR_SCHEDULED")
      return `${base} bg-purple-100 text-purple-800 border border-purple-200`;
    if (status === "REJECTED")
      return `${base} bg-red-100 text-red-800 border border-red-200`;
    return `${base} bg-gray-100 text-gray-800 border border-gray-200`;
  };

  // 🔹 Decide which primary action label to show (if any)
  const getPrimaryLabel = (row) => {
    const stage = typeof row.stage === "number" ? row.stage : 0;
    const aptitudeScore =
      typeof row.aptitudeScore === "number" ? row.aptitudeScore : null;
    const videoScore =
      typeof row.videoInterviewScore === "number"
        ? row.videoInterviewScore
        : null;

    if (row.status === "REJECTED") return null;
    if (row.status === "HR_SCHEDULED" || stage >= 3) return "HR Scheduled";

    // Stage 0 → invite aptitude
    if (stage <= 0) return "Shortlist to Round 1 (Aptitude)";

    // ✅ Stage 2+, aptitude done, video not done, not already SHORTLISTED → invite Round 2
    if (
      stage >= 2 &&
      aptitudeScore !== null &&
      !videoScore &&
      row.status !== "SHORTLISTED"
    ) {
      return "Shortlist to Round 2 (AI Interview)";
    }

    // Stage 2 and video score present → move to HR
    if (stage === 2 && videoScore !== null) {
      return "Select for Final HR Round";
    }

    return null;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Candidates Found
          </h3>
          <p className="text-gray-600">
            No candidates match your current filters.
          </p>
        </div>
      </div>
    );
  }

  const allSelected = rows.every((r) => selectedIds.has(r.applicationId));

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected && rows.length > 0}
                    onChange={(e) =>
                      onToggleAll(
                        rows.map((r) => r.applicationId),
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Job Applied
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  ATS Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Aptitude (Round 1)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Video Interview (Round 2)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Resume
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => {
                const isSelected = selectedIds.has(row.applicationId);

                const atsData =
                  atsResults[row.applicationId] || atsScores[row.email];
                const isGenerating = generatingATS[row.applicationId];

                const stage =
                  typeof row.stage === "number" ? row.stage : 0;

                const aptitudeScore =
                  typeof row.aptitudeScore === "number"
                    ? row.aptitudeScore
                    : typeof row.score === "number"
                    ? row.score
                    : null;
                const aptitudeViolations =
                  row.aptitudeSummary?.proctoring?.totalViolations ??
                  row.aptitudeViolations ??
                  0;
                const autoSubmit =
                  row.aptitudeSummary?.proctoring?.autoSubmitted ??
                  !!row.aptitudeAutoSubmitted;

                const videoScore =
                  typeof row.videoInterviewScore === "number"
                    ? row.videoInterviewScore
                    : null;

                const primaryLabel = getPrimaryLabel({
                  ...row,
                  aptitudeScore,
                  videoInterviewScore: videoScore,
                });

                return (
                  <tr
                    key={row.applicationId}
                    className={`hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(row.applicationId)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Candidate */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {row.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {row.email || "—"}
                        </div>
                      </div>
                    </td>

                    {/* Job */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {row.jobTitle || "—"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {row.company || ""}
                        </div>
                      </div>
                    </td>

                    {/* ATS Score */}
                    <td className="px-6 py-4 align-top">
                      {atsData ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getATSBadge(
                                atsData.overallScore
                              )}`}
                            >
                              {atsData.overallScore}%
                            </span>
                          </div>
                          <div className="space-y-1 text-gray-600">
                            <div className="flex justify-between">
                              <span>Skills</span>
                              <span className="font-semibold">
                                {atsData.skillsMatch}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Experience</span>
                              <span className="font-semibold">
                                {atsData.experienceMatch}%
                              </span>
                            </div>
                          </div>
                          {atsData.recommendation && (
                            <span
                              className={getRecommendationBadge(
                                atsData.recommendation
                              )}
                            >
                              {atsData.recommendation.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not generated
                        </span>
                      )}
                    </td>

                    {/* Aptitude score + violations */}
                    <td className="px-6 py-4 align-top">
                      {aptitudeScore !== null && stage >= 2 ? (
                        <div className="space-y-2 text-xs">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getScoreBadge(
                              aptitudeScore
                            )}`}
                          >
                            {aptitudeScore}%
                          </span>
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-[11px]">
                              {aptitudeViolations} violation
                              {aptitudeViolations === 1 ? "" : "s"}
                            </span>
                            {autoSubmit && (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-semibold text-red-700 border border-red-200">
                                Auto-submitted
                              </span>
                            )}
                          </div>
                        </div>
                      ) : stage >= 1 ? (
                        <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                          Pending
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not invited
                        </span>
                      )}
                    </td>

                    {/* Video Interview */}
                    <td className="px-6 py-4 align-top">
                      {videoScore !== null ? (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getScoreBadge(
                            videoScore
                          )}`}
                        >
                          {videoScore}%
                        </span>
                      ) : stage >= 2 ? (
                        <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                          Pending
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not invited
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(row.status)}>
                        {row.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Applied date */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.appliedDate
                        ? new Date(
                            row.appliedDate._seconds
                              ? row.appliedDate._seconds * 1000
                              : row.appliedDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* Resume */}
                    <td className="px-6 py-4">
                      {row.resumePath ? (
                        <button
                          onClick={() => onViewResume(row)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold underline"
                        >
                          View Resume
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No resume
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleGenerateATS(row)}
                          disabled={isGenerating || !row.resumePath}
                          className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                            isGenerating
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-wait"
                              : !row.resumePath
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : atsData
                              ? "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100"
                              : "bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100"
                          }`}
                        >
                          {isGenerating
                            ? "Generating..."
                            : atsData
                            ? "Regenerate ATS"
                            : "Generate ATS"}
                        </button>

                        <div className="flex flex-col gap-2">
                          {primaryLabel && (
                            <button
                              onClick={() => handlePrimaryAction(row)}
                              disabled={
                                primaryLabel === "HR Scheduled" ||
                                row.status === "HR_SCHEDULED"
                              }
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              {primaryLabel}
                            </button>
                          )}
                          {row.status !== "REJECTED" && (
                            <button
                              onClick={() => handleReject(row)}
                              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <HrModal
        open={hrModalOpen}
        onClose={() => {
          setHrModalOpen(false);
          setHrApplication(null);
        }}
        onConfirm={handleHrConfirm}
        candidateName={hrApplication?.name}
        jobTitle={hrApplication?.jobTitle}
      />
    </>
  );
}
