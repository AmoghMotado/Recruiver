// components/recruiter/CandidatesTable.js - UPDATED WITH REAL DATA
import { useMemo } from "react";

export default function CandidatesTable({
  rows = [],
  selectedIds = new Set(),
  onToggle = () => {},
  onToggleAll = () => {},
  onViewResume = () => {},
  onChangeStatus = () => {},
  onDelete = () => {},
  onBulk = () => {},
  filters = { q: "", status: "All", minScore: 0 },
  setFilters = () => {},
  loading = false,
}) {
  const visible = useMemo(() => {
    const q = (filters?.q ?? "").toLowerCase();
    const status = filters?.status ?? "All";
    const min = Number(filters?.minScore ?? 0);

    return rows.filter((r) => {
      const matchesQ =
        !q ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.role || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q);
      const matchesStatus = status === "All" || r.status === status;
      const matchesScore = (Number(r.score) || 0) >= min;
      return matchesQ && matchesStatus && matchesScore;
    });
  }, [rows, filters]);

  const allVisibleSelected =
    visible.length > 0 && visible.every((r) => selectedIds.has(r.id));

  const anySelected = selectedIds.size > 0;
  const statuses = ["Applied", "Under Review", "Shortlisted", "Rejected"];

  if (loading) {
    return (
      <div className="card">
        <div className="py-12 text-center opacity-70">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Candidates</h3>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div>
            <label className="text-xs opacity-70">Search</label>
            <input
              className="input w-full mt-1"
              placeholder="Search name, email, or role..."
              value={filters?.q ?? ""}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs opacity-70">Status</label>
            <select
              className="input w-full mt-1"
              value={filters?.status ?? "All"}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {["All", ...statuses].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs opacity-70">Min Score</label>
            <input
              type="number"
              min="0"
              max="100"
              className="input w-full mt-1"
              value={filters?.minScore ?? 0}
              onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
            />
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn outline text-xs ${!anySelected ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={!anySelected}
            onClick={() => onBulk("review")}
          >
            Move to Review
          </button>
          <button
            className={`btn outline text-xs ${!anySelected ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={!anySelected}
            onClick={() => onBulk("shortlist")}
          >
            Shortlist
          </button>
          <button
            className={`btn ghost text-xs ${!anySelected ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={!anySelected}
            onClick={() => onBulk("reject")}
          >
            Reject
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr>
              <th className="py-2 pr-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) =>
                    onToggleAll(visible.map((v) => v.id), e.target.checked)
                  }
                />
              </th>
              <th className="py-2 pr-4">Candidate</th>
              <th className="py-2 pr-4">Job Applied</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Applied On</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center opacity-70">
                  No candidates match the filters.
                </td>
              </tr>
            )}
            {visible.map((c) => (
              <tr key={c.id} className="border-t border-white/5">
                <td className="py-3 pr-3 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => onToggle(c.id)}
                  />
                </td>
                <td className="py-3 pr-4">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs opacity-70">{c.email}</div>
                </td>
                <td className="py-3 pr-4">
                  <div className="font-medium">{c.jobTitle}</div>
                  <div className="text-xs opacity-70">{c.company}</div>
                </td>
                <td className="py-3 pr-4">
                  <span className="font-semibold">{c.score}</span>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      c.status === "Shortlisted"
                        ? "bg-emerald-600/30 text-emerald-300"
                        : c.status === "Under Review"
                        ? "bg-blue-600/30 text-blue-300"
                        : c.status === "Rejected"
                        ? "bg-red-600/30 text-red-300"
                        : "bg-gray-600/30 text-gray-300"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs opacity-70">
                  {c.appliedDate ? new Date(c.appliedDate).toLocaleDateString() : "—"}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      className="btn outline text-xs" 
                      onClick={() => onViewResume(c)}
                    >
                      View
                    </button>
                    <button
                      className="btn primary text-xs"
                      onClick={() => onChangeStatus(c.id, "Shortlisted")}
                      disabled={c.status === "Shortlisted"}
                    >
                      Shortlist
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}