// pages/recruiter/candidates.js
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CandidatesTable from "../../components/recruiter/CandidatesTable";

const LS_KEY = "recruiter.candidates";

const seed = [
  {
    id: crypto.randomUUID(),
    name: "Cameron Williamson",
    role: "Software Engineer",
    score: 85,
    status: "Applied",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Jenny Wilson",
    role: "Data Analyst",
    score: 82,
    status: "Under Review",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Ralph Edwards",
    role: "Software Engineer",
    score: 88,
    status: "Shortlisted",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Arjun Mehta",
    role: "DevOps Engineer",
    score: 76,
    status: "Applied",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Priya Nair",
    role: "Product Manager",
    score: 91,
    status: "Under Review",
    resumeUrl: "",
  },
];

function Candidates() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    status: "All",
    minScore: "",
  });
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setRows(raw ? JSON.parse(raw) : seed);
    } catch {
      setRows(seed);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {}
  }, [rows]);

  const setStatusForIds = (ids, status) => {
    setRows((curr) =>
      curr.map((c) => (ids.includes(c.id) ? { ...c, status } : c))
    );
  };

  const removeIds = (ids) => {
    setRows((curr) => curr.filter((c) => !ids.includes(c.id)));
  };

  const onToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onToggleAll = (visibleIds, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const onViewResume = (row) => {
    if (row.resumeUrl) {
      window.open(row.resumeUrl, "_blank");
    } else {
      alert(
        "No resume URL set for this candidate. (You can extend this to open a detailed profile page.)"
      );
    }
  };

  const onChangeStatus = (id, status) => {
    setRows((curr) => curr.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const onDelete = (id) => {
    if (!confirm("Delete this candidate?")) return;
    setRows((curr) => curr.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const onBulk = (action) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === "shortlist") setStatusForIds(ids, "Shortlisted");
    if (action === "review") setStatusForIds(ids, "Under Review");
    if (action === "reject") setStatusForIds(ids, "Rejected");
    if (action === "delete") {
      if (!confirm(`Delete ${ids.length} selected candidate(s)?`)) return;
      removeIds(ids);
    }
    setSelectedIds(new Set());
  };

  const counts = useMemo(() => {
    const total = rows.length;
    const byStatus = rows.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { Applied: 0, "Under Review": 0, Shortlisted: 0, Rejected: 0 }
    );
    return { total, ...byStatus };
  }, [rows]);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Candidates 👥</h1>
        <p className="text-lg text-gray-600">
          Review and manage your applicants across all stages
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Candidates */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Total Candidates
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {counts.total}
          </div>
          <div className="text-xs text-gray-500">All-time applicants</div>
        </div>

        {/* Applied */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Applied
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {counts.Applied}
          </div>
          <div className="text-xs text-gray-500">New submissions</div>
        </div>

        {/* Under Review */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Under Review
          </div>
          <div className="text-3xl font-bold text-amber-600 mb-1">
            {counts["Under Review"]}
          </div>
          <div className="text-xs text-gray-500">In progress</div>
        </div>

        {/* Shortlisted */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Shortlisted
          </div>
          <div className="text-3xl font-bold text-emerald-600 mb-1">
            {counts.Shortlisted}
          </div>
          <div className="text-xs text-gray-500">Move to interviews</div>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Rejected
          </div>
          <div className="text-3xl font-bold text-red-600 mb-1">
            {counts.Rejected}
          </div>
          <div className="text-xs text-gray-500">Not moving forward</div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="space-y-6">
        {/* Section Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">All Candidates</h2>
          <p className="text-sm text-gray-600">
            Search, filter, and manage your candidate pipeline
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Name, email, or role..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                value={filters.q}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, q: e.target.value }))
                }
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="All">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Min Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Score
              </label>
              <input
                type="number"
                placeholder="e.g. 80"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                value={filters.minScore}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minScore: e.target.value }))
                }
              />
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({ q: "", status: "All", minScore: "" })
                }
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onBulk("review")}
                  className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Move to Review
                </button>
                <button
                  onClick={() => onBulk("shortlist")}
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => onBulk("reject")}
                  className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onBulk("delete")}
                  className="px-3 py-2 bg-red-100 text-red-800 border border-red-300 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Candidates Table */}
        <CandidatesTable
          rows={rows}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          onViewResume={onViewResume}
          onChangeStatus={onChangeStatus}
          onDelete={onDelete}
          filters={filters}
        />
      </div>
    </div>
  );
}

Candidates.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="candidates">
      {page}
    </DashboardLayout>
  );
};

export default Candidates;