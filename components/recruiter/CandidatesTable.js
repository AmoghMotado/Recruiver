// components/recruiter/CandidatesTable.js
import { useMemo } from "react";

const STATUS_LABEL = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
};

export default function CandidatesTable({
  rows = [],
  selectedIds = new Set(),
  onToggle = () => {},
  onToggleAll = () => {},
  onViewResume = () => {},
  onChangeStatus = () => {},
  onBulk = () => {},
  filters = { q: "", status: "All", minScore: 0 },
  setFilters = () => {},
  loading = false,
}) {
  const visible = useMemo(() => {
    const q = (filters?.q ?? "").toLowerCase();
    const statusFilter = filters?.status ?? "All";
    const min = Number(filters?.minScore ?? 0);

    return rows.filter((r) => {
      const matchesQ =
        !q ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.jobTitle || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" || r.status === statusFilter;

      const matchesScore = (Number(r.score) || 0) >= min;

      return matchesQ && matchesStatus && matchesScore;
    });
  }, [rows, filters]);

  const allVisibleSelected =
    visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
  const anySelected = selectedIds.size > 0;

  if (loading) {
    return (
      <div className="card">
        <div className="py-12 text-center text-gray-500">
          Loading candidates...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Bulk actions row inside table card */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Candidates</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn outline text-xs ${
              !anySelected ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={!anySelected}
            onClick={() => onBulk("review")}
          >
            Move to Review
          </button>
          <button
            className={`btn outline text-xs ${
              !anySelected ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={!anySelected}
            onClick={() => onBulk("shortlist")}
          >
            Shortlist
          </button>
          <button
            className={`btn ghost text-xs ${
              !anySelected ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={!anySelected}
            onClick={() => onBulk("reject")}
          >
            Reject
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 text-xs uppercase">
            <tr>
              <th className="py-2 pr-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) =>
                    onToggleAll(
                      visible.map((v) => v.id),
                      e.target.checked
                    )
                  }
                />
              </th>
              <th className="py-2 pr-4">Candidate</th>
              <th className="py-2 pr-4">Job Applied</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Applied On</th>
              <th className="py-2 pr-4">Resume</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-gray-400 text-sm"
                >
                  No candidates match the filters.
                </td>
              </tr>
            )}
            {visible.map((c) => {
              const label = STATUS_LABEL[c.status] || "Applied";
              return (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="py-3 pr-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => onToggle(c.id)}
                    />
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <div className="font-medium text-gray-900">
                      {c.jobTitle}
                    </div>
                    <div className="text-xs text-gray-500">{c.company}</div>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <span className="font-semibold">
                      {c.score != null ? c.score : 0}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        c.status === "SHORTLISTED"
                          ? "bg-emerald-100 text-emerald-700"
                          : c.status === "UNDER_REVIEW"
                          ? "bg-blue-100 text-blue-700"
                          : c.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-top text-xs text-gray-500">
                    {c.appliedDate
                      ? new Date(
                          c.appliedDate._seconds
                            ? c.appliedDate._seconds * 1000
                            : c.appliedDate
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {c.resumePath ? (
                      <button
                        className="text-xs text-indigo-600 underline font-medium"
                        onClick={() => onViewResume(c)}
                      >
                        View Resume
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn outline text-xs"
                        onClick={() => onChangeStatus(c.id, "SHORTLISTED")}
                        disabled={c.status === "SHORTLISTED"}
                      >
                        Shortlist
                      </button>
                      <button
                        className="btn ghost text-xs"
                        onClick={() => onChangeStatus(c.id, "REJECTED")}
                        disabled={c.status === "REJECTED"}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
