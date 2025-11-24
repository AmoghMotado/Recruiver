// ============================================
// FILE 2: pages/recruiter/candidates.js
// ============================================
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CandidatesTable from "@/components/recruiter/CandidatesTable";

function RecruiterCandidatesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [atsScores, setAtsScores] = useState({});
  const [loadingScores, setLoadingScores] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    status: "All",
    minScore: 0,
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const pollRef = useRef(null);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/recruiter-candidates", {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to load candidates");
      }

      const baseRows = data.candidates || [];

      const merged = baseRows.map((c) => {
        const scoreData = atsScores[c.email];
        return scoreData
          ? {
              ...c,
              score: Math.round(scoreData.overallScore) || 0,
            }
          : c;
      });

      setRows(merged);
    } catch (err) {
      console.error("Error loading candidates:", err);
      alert(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const loadATSScores = async () => {
    setLoadingScores(true);
    try {
      const res = await fetch("/api/candidates/ats-scores", {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load ATS scores");
      }

      const scores = data.scores || {};
      setAtsScores(scores);

      setRows((prev) =>
        prev.map((row) => {
          const scoreData = scores[row.email];
          if (scoreData) {
            return {
              ...row,
              score: Math.round(scoreData.overallScore) || row.score || 0,
            };
          }
          return row;
        })
      );
    } catch (err) {
      console.error("Error loading ATS scores:", err);
    } finally {
      setLoadingScores(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    loadATSScores();
    pollRef.current = setInterval(() => {
      loadATSScores();
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = (ids, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const handleBulk = async (action) => {
    if (!selectedIds.size) return;

    let status = null;
    if (action === "review") status = "UNDER_REVIEW";
    if (action === "shortlist") status = "SHORTLISTED";
    if (action === "reject") status = "REJECTED";
    if (!status) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/jobs/applications/${id}/status`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
      setSelectedIds(new Set());
      await loadCandidates();
    } catch (err) {
      console.error("Bulk update error:", err);
      alert(err.message || "Failed to update selected applications");
    }
  };

  const handleViewResume = (candidate) => {
    if (!candidate.resumePath) {
      alert("No resume uploaded for this candidate.");
      return;
    }
    window.open(candidate.resumePath, "_blank");
  };

  const advanceApplication = async (applicationId, action, extra = {}) => {
    try {
      const res = await fetch(
        `/api/jobs/applications/${applicationId}/advance`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to advance application");
      }
      await loadCandidates();
    } catch (err) {
      console.error("advanceApplication error:", err);
      alert(err.message || "Failed to update application");
    }
  };

  const total = rows.length;
  const applied = rows.filter((r) => r.status === "APPLIED").length;
  const underReview = rows.filter((r) => r.status === "UNDER_REVIEW").length;
  const shortlisted = rows.filter((r) => r.status === "SHORTLISTED").length;
  const hrScheduled = rows.filter((r) => r.status === "HR_SCHEDULED").length;

  const scored = rows.filter((r) => r.score && r.score > 0);
  const avgScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, r) => sum + (r.score || 0), 0) / scored.length
        )
      : 0;

  const filteredRows = rows.filter((row) => {
    const q = filters.q.trim().toLowerCase();
    const matchesSearch =
      !q ||
      row.name?.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q) ||
      row.jobTitle?.toLowerCase().includes(q);

    const matchesStatus =
      filters.status === "All" || row.status === filters.status;

    const matchesScore =
      !filters.minScore || (row.score || 0) >= Number(filters.minScore || 0);

    return matchesSearch && matchesStatus && matchesScore;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard label="Total Candidates" value={total} icon="👥" />
        <SummaryCard label="Applied" value={applied} icon="📝" />
        <SummaryCard label="Under Review" value={underReview} icon="🔍" />
        <SummaryCard
          label="Shortlisted"
          value={shortlisted}
          accent="text-emerald-600"
          icon="✅"
        />
        <SummaryCard
          label="HR Scheduled"
          value={hrScheduled}
          accent="text-purple-600"
          icon="📅"
        />
      </div>

      {/* Filters & refresh */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Candidates</h2>
            <p className="text-xs text-gray-600 mt-1">
              Review and manage your applicants with real-time insights
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadCandidates}
              disabled={loading}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                loading
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {loading ? "⏳ Loading..." : "🔄 Refresh"}
            </button>
            <button
              onClick={loadATSScores}
              disabled={loadingScores}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                loadingScores
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300"
              }`}
            >
              {loadingScores ? "⏳ Updating..." : "📊 Refresh Scores"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Search Candidates
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Name, email, or job title..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="All">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="HR_SCHEDULED">HR Scheduled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Minimum ATS Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. 70"
              value={filters.minScore}
              onChange={(e) =>
                setFilters({ ...filters, minScore: e.target.value })
              }
            />
          </div>
        </div>

        <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
          Showing{" "}
          <span className="font-semibold">{filteredRows.length}</span> of{" "}
          <span className="font-semibold">{rows.length}</span> candidates
          {scored.length > 0 && (
            <span className="ml-2">
              • <span className="font-semibold">{scored.length}</span> with ATS
              scores (avg {avgScore}%)
            </span>
          )}
        </div>
      </div>

      {/* Bulk actions banner */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-indigo-900">
            {selectedIds.size} candidate
            {selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulk("review")}
              className="px-4 py-2 bg-amber-50 text-amber-700 border-2 border-amber-300 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-all"
            >
              📋 Move to Review
            </button>
            <button
              onClick={() => handleBulk("shortlist")}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 text-sm font-semibold rounded-lg hover:bg-emerald-100 transition-all"
            >
              ✅ Shortlist
            </button>
            <button
              onClick={() => handleBulk("reject")}
              className="px-4 py-2 bg-red-50 text-red-700 border-2 border-red-300 text-sm font-semibold rounded-lg hover:bg-red-100 transition-all"
            >
              ❌ Reject
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <CandidatesTable
        rows={filteredRows}
        loading={loading}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        onViewResume={handleViewResume}
        atsScores={atsScores}
        onRefresh={loadCandidates}
        onAdvanceApplication={advanceApplication}
      />
    </div>
  );
}

function SummaryCard({ label, value, accent, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105 cursor-default">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {label}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold ${accent || "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}

RecruiterCandidatesPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="candidates">
      {page}
    </DashboardLayout>
  );
};

export default RecruiterCandidatesPage;
