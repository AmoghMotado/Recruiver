import { useEffect, useMemo, useState } from "react";

/**
 * Parses JDs to extract a very simple skills frequency and renders
 * a horizontal bar chart (no external libraries).
 */
export default function SkillsBarChart() {
  const [jds, setJds] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recruiter.jds");
      setJds(raw ? JSON.parse(raw) : []);
    } catch {
      setJds([]);
    }
  }, []);

  // Basic skill dictionary (extend freely)
  const DICT = [
    "react",
    "node",
    "typescript",
    "javascript",
    "python",
    "java",
    "sql",
    "mongodb",
    "postgres",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "graphql",
    "rest",
    "agile",
    "ci/cd",
    "microservices",
    "ml",
    "nlp",
  ];

  const counts = useMemo(() => {
    const c = {};
    const text = (jds || []).map((x) => x.jd || "").join("\n").toLowerCase();
    DICT.forEach((k) => {
      const re = new RegExp(`\\b${k.replace("/", "\\/")}\\b`, "g");
      const m = text.match(re);
      c[k] = m ? m.length : 0;
    });
    // pick top 8
    return Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [jds]);

  const max = Math.max(1, ...counts.map(([, v]) => v));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Top Skills in JDs</h3>
        <div className="text-xs opacity-70">From {jds.length} JD(s)</div>
      </div>
      {counts.length === 0 ? (
        <div className="text-sm opacity-70">No JDs found. Add some in “Upload JD”.</div>
      ) : (
        <div className="space-y-2">
          {counts.map(([skill, val]) => {
            const pct = Math.round((val / max) * 100);
            return (
              <div key={skill}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="opacity-90">{skill.toUpperCase()}</span>
                  <span className="opacity-70">{val}</span>
                </div>
                <div className="w-full h-2 rounded bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-indigo-400 to-emerald-400"
                    style={{ width: `${pct}%` }}
                    aria-label={`${skill} bar`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
