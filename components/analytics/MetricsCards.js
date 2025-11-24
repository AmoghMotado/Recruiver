// components/analytics/MetricsCards.js
import { useMemo } from "react";

export default function MetricsCards({ totalCandidates, filteredCount, candidates }) {
  const metrics = useMemo(() => {
    const avgCompletion = candidates.length > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + (c.profileCompletion || 0), 0) /
            candidates.length
        )
      : 0;

    const readyToInterview = candidates.filter(
      (c) => c.profileCompletion >= 70 && (c.skills || []).length >= 3
    ).length;

    const newThisMonth = candidates.filter((c) => {
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;

    const totalSkills = new Set();
    candidates.forEach((c) => {
      (c.skills || []).forEach((skill) => totalSkills.add(skill));
    });

    return {
      total: totalCandidates,
      filtered: filteredCount,
      avgCompletion,
      readyToInterview,
      newThisMonth,
      uniqueSkills: totalSkills.size,
    };
  }, [totalCandidates, filteredCount, candidates]);

  const cards = [
    {
      label: "Total Candidates",
      value: metrics.total,
      color: "gray",
      icon: "👥",
    },
    {
      label: "Filtered Results",
      value: metrics.filtered,
      color: "indigo",
      icon: "🔍",
    },
    {
      label: "New This Month",
      value: metrics.newThisMonth,
      color: "emerald",
      icon: "🆕",
    },
    {
      label: "Ready to Interview",
      value: metrics.readyToInterview,
      color: "blue",
      icon: "✅",
    },
    {
      label: "Avg Profile Complete",
      value: `${metrics.avgCompletion}%`,
      color: "purple",
      icon: "📊",
    },
    {
      label: "Unique Skills",
      value: metrics.uniqueSkills,
      color: "amber",
      icon: "⚡",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {card.label}
            </div>
            <div className="text-2xl">{card.icon}</div>
          </div>
          <div
            className={`text-3xl font-bold ${
              card.color === "gray"
                ? "text-gray-900"
                : card.color === "indigo"
                ? "text-indigo-600"
                : card.color === "emerald"
                ? "text-emerald-600"
                : card.color === "blue"
                ? "text-blue-600"
                : card.color === "purple"
                ? "text-purple-600"
                : "text-amber-600"
            }`}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}