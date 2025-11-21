import { useEffect, useMemo, useState } from "react";

/**
 * Mock AI insights:
 * - Generates suggestions based on candidate & job counts.
 * - Shows a brief shimmer animation while "thinking".
 */
export default function AIInsights() {
  const [jobs, setJobs] = useState([]);
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);

  useEffect(() => {
    try {
      const j = localStorage.getItem("recruiter.jobs");
      const c = localStorage.getItem("recruiter.candidates");
      setJobs(j ? JSON.parse(j) : []);
      setCands(c ? JSON.parse(c) : []);
    } catch {
      setJobs([]);
      setCands([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const derived = useMemo(() => {
    const open = jobs.filter((j) => j.status === "Open").length;
    const totalApp = jobs.reduce((s, j) => s + (Number(j.applicants) || 0), 0);
    const avgScore =
      cands.length > 0
        ? Math.round(cands.reduce((s, c) => s + (Number(c.score) || 0), 0) / cands.length)
        : 0;
    const shortlist = cands.filter((c) => c.status === "Shortlisted").length;

    const t = [];
    if (open >= 3 && totalApp / (open || 1) < 10)
      t.push("Low applicant flow per open role — consider broadening channels or simplifying must-haves.");
    if (avgScore >= 80)
      t.push("Strong candidate quality — prioritize faster interview loops to avoid drop-offs.");
    if (shortlist < Math.ceil(cands.length * 0.15))
      t.push("Shortlisting ratio is low — review screening criteria to avoid missing good fits.");
    if (t.length === 0)
      t.push("Pipeline is healthy — continue current sourcing and screening strategy.");

    return { open, totalApp, avgScore, shortlist, t };
  }, [jobs, cands]);

  useEffect(() => {
    if (!loading) setTips(derived.t);
  }, [loading, derived.t]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">AI Insights</h3>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 rounded bg-gradient-to-r from-white/10 via-white/30 to-white/10 animate-pulse" />
          ))}
          <div className="text-sm opacity-70 mt-2">Analyzing your pipeline…</div>
        </div>
      ) : (
        <ul className="list-disc pl-5 text-sm space-y-2">
          {tips.map((t, i) => (
            <li key={i} className="opacity-90">{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
