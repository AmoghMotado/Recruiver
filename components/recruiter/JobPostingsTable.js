// components/recruiter/JobPostingsTable.js
export default function JobPostingsTable({
  jobs = [],
  loading = false,
  onAddJob,
  onEditJob,
  onDeleteJob,
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Job Postings</h3>
        <button className="btn primary" onClick={onAddJob}>
          + Add New Job
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center opacity-70">Loading jobs...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr>
                <th className="py-2 pr-4">Job Title</th>
                <th className="py-2 pr-4">Company</th>
                <th className="py-2 pr-4">Applicants</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center opacity-70">
                    No job postings yet. Click "Add New Job" to get started.
                  </td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-white/5">
                  <td className="py-3 pr-4 font-medium">{j.title}</td>
                  <td className="py-3 pr-4">{j.company || "—"}</td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold">{j.applicants}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        j.status === "Open"
                          ? "bg-emerald-600/30 text-emerald-300"
                          : "bg-gray-600/30 text-gray-300"
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs opacity-70">{j.updated}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <button 
                        className="btn outline text-xs" 
                        onClick={() => onEditJob(j)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn ghost text-xs"
                        onClick={() => onDeleteJob(j.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}