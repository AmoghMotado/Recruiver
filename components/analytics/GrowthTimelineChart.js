// components/analytics/GrowthTimelineChart.js
import { useMemo } from "react";

export default function GrowthTimelineChart({ candidates }) {
  const monthlyData = useMemo(() => {
    const last6Months = [];
    const now = new Date();

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();

      last6Months.push({
        month: `${monthName} ${year}`,
        count: 0,
        monthIndex: date.getMonth(),
        yearIndex: date.getFullYear(),
      });
    }

    // Count candidates per month
    candidates.forEach((candidate) => {
      if (!candidate.createdAt) return;

      const created = new Date(candidate.createdAt);
      last6Months.forEach((monthData) => {
        if (
          created.getMonth() === monthData.monthIndex &&
          created.getFullYear() === monthData.yearIndex
        ) {
          monthData.count++;
        }
      });
    });

    return last6Months;
  }, [candidates]);

  const maxCount = Math.max(1, ...monthlyData.map((d) => d.count));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>📅</span> Candidate Growth (6 Months)
        </h3>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Timeline
        </span>
      </div>

      <div className="space-y-3">
        {monthlyData.map((data, idx) => {
          const heightPercentage = Math.round((data.count / maxCount) * 100);
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="text-xs font-semibold text-gray-600 w-20 text-right">
                {data.month}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${heightPercentage}%` }}
                >
                  {data.count > 0 && (
                    <span className="text-xs font-bold text-white">
                      {data.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}