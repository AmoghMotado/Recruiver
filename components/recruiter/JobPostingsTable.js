// components/recruiter/JobPostingsTable.js

export default function JobPostingsTable({
  jobs,
  loading,
  onAddJob,
  onEditJob,
  onDeleteJob,
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading job postings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-200 rounded-xl p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">📋</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              No job postings yet
            </h3>
            <p className="text-gray-600">
              Create your first job posting to start recruiting
            </p>
          </div>
          <button
            onClick={onAddJob}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Create First Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Job Title
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Location
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Experience
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Deadline
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Applicants
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                JD
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Updated
              </th>
              <th className="px-8 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-8 py-4">
                  <div className="font-semibold text-gray-900">
                    {job.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {job.company || "—"}
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm text-gray-700">
                    {job.location || "—"}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm text-gray-700">
                    {job.experience || "—"}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm text-gray-700">
                    {job.deadline || "—"}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200">
                    <span className="text-sm font-bold text-indigo-700">
                      {job.applicants ?? 0}
                    </span>
                    <span className="text-indigo-600">👥</span>
                  </span>
                </td>
                <td className="px-8 py-4">
                  {job.jdFilePath ? (
                    <a
                      href={job.jdFilePath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View JD
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-8 py-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      job.status === "Open"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {job.status === "Open" ? "✓" : "–"} {job.status}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm text-gray-600">
                    {job.updated || "—"}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEditJob(job)}
                      className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit job"
                    >
                      <span className="text-lg">✏️</span>
                    </button>
                    <button
                      onClick={() => onDeleteJob(job.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete job"
                    >
                      <span className="text-lg">🗑️</span>
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
