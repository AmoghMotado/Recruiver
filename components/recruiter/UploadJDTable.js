export default function UploadJDTable({ jds = [], onAdd, onEdit, onDelete, onView }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Job Descriptions</h3>
        <button className="btn outline" onClick={onAdd}>+ Add New JD</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Updated</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {jds.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center opacity-70">
                  No job descriptions yet.
                </td>
              </tr>
            )}
            {jds.map((jd) => (
              <tr key={jd.id} className="border-t border-white/5">
                <td className="py-3 pr-4">{jd.title}</td>
                <td className="py-3 pr-4">{jd.updated}</td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn outline" onClick={() => onView(jd)}>View</button>
                    <button className="btn primary" onClick={() => onEdit(jd)}>Edit</button>
                    <button
                      className="btn ghost"
                      onClick={() => {
                        if (confirm(`Delete JD "${jd.title}"?`)) onDelete(jd.id);
                      }}
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
    </div>
  );
}
