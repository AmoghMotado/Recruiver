// components/JobCard.js
// Simple generic job card still used in a few places.
// Updated to match light SaaS theme.

export default function JobCard({
  title,
  company,
  stack,
  location,
  salary,
  exp,
}) {
  return (
    <div className="card p-5 space-y-3">
      <h3 className="text-base md:text-lg font-semibold text-slate-900">
        {title}{" "}
        <span className="font-medium text-slate-500">— {company}</span>
      </h3>

      {stack && (
        <p className="text-sm text-slate-500 truncate">{stack}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs md:text-sm">
        {location && <span className="pill">{location}</span>}
        {salary && <span className="pill">₹ {salary}</span>}
        {exp && <span className="pill">{exp}</span>}
      </div>

      <div className="pt-1">
        <button className="btn text-xs md:text-sm">View details</button>
      </div>
    </div>
  );
}
