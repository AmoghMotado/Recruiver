// components/analytics/SkillsDistributionChart.js
import { useMemo } from "react";

export default function SkillsDistributionChart({ candidates }) {
  const skillsData = useMemo(() => {
    const skillCounts = {};

    candidates.forEach((candidate) => {
      (candidate.skills || []).forEach((skill) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
  }, [candidates]);

  const maxCount = Math.max(1, ...skillsData.map((d) => d.count));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>📊</span> Top Skills Distribution
        </h3>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Top 10
        </span>
      </div>

      {skillsData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No skills data available
        </div>
      ) : (
        <div className="space-y-4">
          {skillsData.map(({ skill, count }, idx) => {
            const percentage = Math.round((count / maxCount) * 100);
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    {skill}
                  </span>
                  <span className="text-sm font-semibold text-indigo-600">
                    {count} {count === 1 ? "candidate" : "candidates"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
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