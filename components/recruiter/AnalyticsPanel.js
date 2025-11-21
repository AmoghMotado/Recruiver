export default function AnalyticsPanel() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-2">AI & Analytics</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="card">
            <div className="font-semibold">AI Insights</div>
            <ul className="mt-2 list-disc pl-5 opacity-90">
              <li>Backend Engineer role trending +18% applicants</li>
              <li>Avg time-to-fill prediction: 22 days</li>
              <li>Top source: LinkedIn (42%)</li>
            </ul>
          </div>
          <div className="card">
            <div className="font-semibold">Top Candidates</div>
            <ul className="mt-2 list-disc pl-5 opacity-90">
              <li>R. Edwards — 88 (SE)</li>
              <li>J. Wilson — 82 (Data)</li>
              <li>C. Williamson — 85 (SE)</li>
            </ul>
          </div>
          <div className="card col-span-2">
            <div className="font-semibold">Skill Gap Analysis</div>
            <p className="text-sm opacity-80 mt-2">
              Applicants show shortage in: GraphQL, Kubernetes, System Design. Consider updating JD with “nice-to-have”.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
