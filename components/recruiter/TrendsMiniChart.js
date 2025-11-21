import { useEffect, useMemo, useState } from "react";

/**
 * Tiny SVG sparkline showing applicants per job (uses current localStorage jobs).
 */
export default function TrendsMiniChart() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recruiter.jobs");
      setJobs(raw ? JSON.parse(raw) : []);
    } catch {
      setJobs([]);
    }
  }, []);

  const data = useMemo(() => {
    const arr = (jobs || []).map((j) => Number(j.applicants) || 0);
    return arr.length ? arr : [0];
  }, [jobs]);

  const { points, max } = useMemo(() => {
    const W = 320;
    const H = 80;
    const maxVal = Math.max(1, ...data);
    const gap = data.length > 1 ? W / (data.length - 1) : 0;
    const pts = data.map((v, i) => {
      const x = i * gap;
      const y = H - (v / maxVal) * (H - 6) - 3; // padding
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { points: pts.join(" "), max: maxVal };
  }, [data]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Applicants per Job (Sparkline)</h3>
        <div className="text-xs opacity-70">{data.length} job(s) • max {max}</div>
      </div>
      <svg width="100%" height="96" viewBox="0 0 320 80" className="mt-2">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.9)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.2)" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
    </div>
  );
}
