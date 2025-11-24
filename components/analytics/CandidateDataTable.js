// components/analytics/CandidateDataTable.js
import { useState, useMemo } from "react";

export default function CandidateDataTable({ candidates, onExport }) {
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting logic
  const sortedCandidates = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      // Handle different data types
      if (sortField === "experienceYears" || sortField === "profileCompletion") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortField === "skills") {
        aVal = (a.skills || []).length;
        bVal = (b.skills || []).length;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [candidates, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);
  const paginatedCandidates = sortedCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>📋</span> Candidate Data Table
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {sortedCandidates.length} {sortedCandidates.length === 1 ? "candidate" : "candidates"}
          </p>
        </div>
        <button
          onClick={onExport}
          className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
        >
          📥 Export CSV
        </button>
      </div>

      {sortedCandidates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No candidates found matching your filters
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th
                    className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("name")}
                  >
                    Name {getSortIcon("name")}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("email")}
                  >
                    Email {getSortIcon("email")}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("headline")}
                  >
                    Headline {getSortIcon("headline")}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("skills")}
                  >
                    Skills {getSortIcon("skills")}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("experienceYears")}
                  >
                    Experience {getSortIcon("experienceYears")}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("profileCompletion")}
                  >
                    Profile % {getSortIcon("profileCompletion")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        {candidate.name || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {candidate.email || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        {candidate.headline || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(candidate.skills || []).slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {(candidate.skills || []).length > 3 && (
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {candidate.experienceYears || 0} yrs
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              candidate.profileCompletion >= 80
                                ? "bg-emerald-500"
                                : candidate.profileCompletion >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${candidate.profileCompletion || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {candidate.profileCompletion || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, sortedCandidates.length)}{" "}
                of {sortedCandidates.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3 py-1 text-sm font-semibold rounded-lg ${
                      currentPage === idx + 1
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}