export default function StatsCards({
  totals = { applicants: 124, jobs: 5, shortlisted: 28, events: 8 },
}) {
  const items = [
    { label: "Total Applicants", value: totals.applicants },
    { label: "Active Job Posts", value: totals.jobs },
    { label: "Shortlisted Candidates", value: totals.shortlisted },
    { label: "Upcoming Events", value: totals.events },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((s, i) => (
        <div key={i} className="card">
          <div className="text-3xl font-bold">{s.value}</div>
          <div className="opacity-70 text-sm">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
