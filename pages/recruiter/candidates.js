// pages/recruiter/candidates.js
import { useEffect, useState, useRef } from "react";
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
  const pollIntervalRef = useRef(null);

  // Load candidates from backend
  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/recruiter-candidates", {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        alert("Not authenticated. Please log in again.");
        if (typeof window !== "undefined") {
          window.location.href = "/login?role=recruiter";
        }
        return;
      }
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load candidates");
      }
      
      // Merge with existing ATS scores
      const candidatesWithScores = (data.candidates || []).map((candidate) => {
        const scoreData = atsScores[candidate.email];
        if (scoreData) {
          return {
            ...candidate,
            score: Math.round(scoreData.overallScore) || 0,
            atsData: scoreData,
          };
        }
        return candidate;
      });
      
      setRows(candidatesWithScores);
    } catch (err) {
      console.error("Error loading candidates:", err);
      alert(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  // Load ATS scores from Firestore
  const loadATSScores = async () => {
    setLoadingScores(true);
    try {
      const res = await fetch("/api/candidates/ats-scores");
      const data = await res.json();

      if (data.success) {
        const scores = data.scores || {};
        setAtsScores(scores);

        // Update rows with latest ATS scores
        setRows((prevRows) =>
          prevRows.map((row) => {
            const scoreData = scores[row.email];
            if (scoreData) {
              return {
                ...row,
                score: Math.round(scoreData.overallScore) || row.score,
                atsData: scoreData,
              };
            }
            return row;
          })
        );
      }
    } catch (err) {
      console.error("Error loading ATS scores:", err);
    } finally {
      setLoadingScores(false);
    }
  };

  // Load candidates on mount
  useEffect(() => {
    loadCandidates();
  }, []);

  // Load ATS scores on mount and set up polling
  useEffect(() => {
    loadATSScores();

    // Poll for score updates every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      loadATSScores();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
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

  const updateStatus = async (applicationId, status) => {
    try {
      const res = await fetch(
        `/api/jobs/applications/${applicationId}/status`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update application");
      }
      await loadCandidates();
    } catch (err) {
      alert(err.message || "Failed to update application");
    }
  };

  const handleBulk = async (action) => {
    if (selectedIds.size === 0) return;

    let status;
    if (action === "review") status = "UNDER_REVIEW";
    else if (action === "shortlist") status = "SHORTLISTED";
    else if (action === "reject") status = "REJECTED";
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
      alert(err.message || "Failed to update selected applications");
    }
  };

  const handleViewResume = (candidate) => {
    if (!candidate.resumePath) {
      alert("No resume uploaded for this candidate.");
      return;
    }
    if (typeof window !== "undefined") {
      window.open(candidate.resumePath, "_blank");
    }
  };

  // Calculate stats
  const total = rows.length;
  const applied = rows.filter((r) => r.status === "APPLIED").length;
  const underReview = rows.filter((r) => r.status === "UNDER_REVIEW").length;
  const shortlisted = rows.filter((r) => r.status === "SHORTLISTED").length;
  const rejected = rows.filter((r) => r.status === "REJECTED").length;
  const avgScore =
    rows.length > 0
      ? Math.round(rows.reduce((sum, r) => sum + (r.score || 0), 0) / rows.length)
      : 0;

  // Filter candidates based on filters
  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !filters.q ||
      row.name?.toLowerCase().includes(filters.q.toLowerCase()) ||
      row.email?.toLowerCase().includes(filters.q.toLowerCase());

    const matchesStatus =
      filters.status === "All" || row.status === filters.status;

    const matchesScore =
      !filters.minScore || (row.score || 0) >= parseInt(filters.minScore);

    return matchesSearch && matchesStatus && matchesScore;
  });

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
          Candidates <span className="text-2xl">👥</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Review and manage your applicants with real-time ATS scores
        </p>
      </div>

      {/* Summary cards - Updated with ATS info */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard label="Total Candidates" value={total} />
        <SummaryCard label="Applied" value={applied} />
        <SummaryCard label="Under Review" value={underReview} />
        <SummaryCard
          label="Shortlisted"
          value={shortlisted}
          accent="text-emerald-600"
        />
        <SummaryCard
          label="Avg ATS Score"
          value={`${avgScore}%`}
          accent="text-indigo-600"
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">All Candidates</h2>
            <p className="text-xs text-gray-600 mt-1">
              Search, filter, and manage your candidate pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadCandidates}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              🔄 Refresh Candidates
            </button>
            <button
              onClick={loadATSScores}
              disabled={loadingScores}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                loadingScores
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              }`}
            >
              {loadingScores ? "Updating Scores..." : "📊 Refresh Scores"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Search
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Name, email, or role..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Status
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
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Min ATS Score
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

        {/* Show filtered results count */}
        <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
          Showing <span className="font-semibold">{filteredRows.length}</span> of{" "}
          <span className="font-semibold">{rows.length}</span> candidates
        </div>
      </div>

      {/* Bulk action indicator */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-900">
            {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulk("review")}
              className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-colors"
            >
              Move to Review
            </button>
            <button
              onClick={() => handleBulk("shortlist")}
              className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Shortlist
            </button>
            <button
              onClick={() => handleBulk("reject")}
              className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <CandidatesTable
        rows={filteredRows}
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        onChangeStatus={updateStatus}
        onBulk={handleBulk}
        onViewResume={handleViewResume}
        atsScores={atsScores}
      />
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
        {label}
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