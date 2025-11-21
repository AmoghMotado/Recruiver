import { useEffect, useState } from "react";

/**
 * Reads recruiter data from localStorage and shows high-level KPIs.
 * - recruiter.jobs         -> [{applicants,status}, ...]
 * - recruiter.candidates   -> [{score,status}, ...]
 * - recruiter.jds          -> [{title,jd}, ...]
 */
export default function AnalyticsSummary() {
  const [data, setData] = useState({
    jobs: [],
    candidates: [],
    jds: [],
  });

  useEffect(() => {
    const safeGet = (k, fallback = []) => {
      try {
        const raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    setData({
      jobs: safeGet("recruiter.jobs", []),
      candidates: safeGet("recruiter.candidates", []),
      jds: safeGet("recruiter.jds", []),
    });
  }, []);

  const totals = (() => {
    const openJobs = data.jobs.filter((j) => j.status === "Open").length;
    const applicants = data.jobs.reduce((s, j) => s + (Number(j.applicants) || 0), 0);
    const avgScore =
      data.candidates.length > 0
        ? Math.round(
            data.candidates.reduce((s, c) => s + (Number(c.score) || 0), 0) /
              data.candidates.length
          )
        : 0;
    const shortlisted = data.candidates.filter((c) => c.status === "Shortlisted").length;
    const jdCount = data.jds.length;

    return { openJobs, applicants, avgScore, shortlisted, jdCount };
  })();

  const items = [
    { label: "Total Applicants", value: totals.applicants },
    { label: "Open Job Posts", value: totals.openJobs },
    { label: "Avg Candidate Score", value: `${totals.avgScore}%` },
    { label: "Shortlisted", value: totals.shortlisted },
    { label: "Job Descriptions", value: totals.jdCount },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {items.map((s, i) => (
        <div key={i} className="card">
          <div className="text-2xl font-bold">{s.value}</div>
          <div className="opacity-70 text-sm">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
