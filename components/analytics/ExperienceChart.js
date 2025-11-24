// components/analytics/ExperienceChart.js
import { useMemo } from "react";

export default function ExperienceChart({ candidates }) {
  const experienceData = useMemo(() => {
    const ranges = {
      "0-2 years": 0,
      "2-5 years": 0,
      "5-8 years": 0,
      "8-12 years": 0,
      "12+ years": 0,
    };

    candidates.forEach((candidate) => {
      const years = candidate.experienceYears || 0;
      if (years <= 2) ranges["0-2 years"]++;
      else if (years <= 5) ranges["2-5 years"]++;
      else if (years <= 8) ranges["5-8 years"]++;
      else if (years <= 12) ranges["8-12 years"]++;
      else ranges["12+ years"]++;
    });

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
      percentage:
        candidates.length > 0
          ? Math.round((count / candidates.length) * 100)
          : 0,
    }));
  }, [candidates]);

  const colors = [
    "from-blue-400 to-blue-600",
    "from-indigo-400 to-indigo-600",
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
    "from-rose-400 to-rose-600",
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>📈</span> Experience Breakdown
        </h3>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {candidates.length} Total
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No experience data available
        </div>
      ) : (
        <div className="space-y-4">
          {experienceData.map((data, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {data.range}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">
                    {data.count}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 min-w-[3rem] text-right">
                    {data.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`bg-gradient-to-r ${colors[idx]} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}