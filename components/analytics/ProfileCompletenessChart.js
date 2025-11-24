// components/analytics/ProfileCompletenessChart.js
import { useMemo } from "react";

export default function ProfileCompletenessChart({ candidates }) {
  const completionData = useMemo(() => {
    const ranges = {
      "0-20%": 0,
      "20-40%": 0,
      "40-60%": 0,
      "60-80%": 0,
      "80-100%": 0,
    };

    candidates.forEach((candidate) => {
      const completion = candidate.profileCompletion || 0;
      if (completion < 20) ranges["0-20%"]++;
      else if (completion < 40) ranges["20-40%"]++;
      else if (completion < 60) ranges["40-60%"]++;
      else if (completion < 80) ranges["60-80%"]++;
      else ranges["80-100%"]++;
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
    "from-red-400 to-red-600",
    "from-orange-400 to-orange-600",
    "from-yellow-400 to-yellow-600",
    "from-lime-400 to-lime-600",
    "from-emerald-400 to-emerald-600",
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>📋</span> Profile Completeness
        </h3>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Distribution
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No completion data available
        </div>
      ) : (
        <div className="space-y-4">
          {completionData.map((data, idx) => (
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