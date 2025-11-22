// pages/recruiter/analytics.js
import DashboardLayout from "@/components/DashboardLayout";

function Analytics() {
  // Sample data
  const stats = {
    totalApplicants: 127,
    openJobs: 8,
    avgScore: 78,
    shortlisted: 24,
    avgTimeToFill: "18 days",
    conversionRate: 18.9,
  };

  const topSkills = [
    { skill: "React", count: 89, percentage: 70 },
    { skill: "Node.js", count: 76, percentage: 60 },
    { skill: "TypeScript", count: 68, percentage: 54 },
    { skill: "JavaScript", count: 112, percentage: 88 },
    { skill: "Python", count: 45, percentage: 35 },
    { skill: "Java", count: 38, percentage: 30 },
    { skill: "SQL", count: 92, percentage: 72 },
    { skill: "MongoDB", count: 41, percentage: 32 },
  ];

  const jobTrends = [
    { role: "Frontend Dev", applicants: 34, shortlisted: 8 },
    { role: "Backend Dev", applicants: 28, shortlisted: 6 },
    { role: "Full Stack", applicants: 31, shortlisted: 7 },
    { role: "DevOps", applicants: 18, shortlisted: 2 },
    { role: "QA Engineer", applicants: 16, shortlisted: 1 },
  ];

  const insights = [
    {
      icon: "📈",
      title: "Pipeline Health",
      description: "Your pipeline is healthy with strong candidate flow. Continue current sourcing strategy.",
      color: "emerald",
    },
    {
      icon: "⚡",
      title: "High-Demand Skills",
      description: "JavaScript and SQL are the most common skills. Consider prioritizing these.",
      color: "blue",
    },
    {
      icon: "🎯",
      title: "Time to Fill",
      description: "Average time to fill is 18 days. Monitor if interviews are bottlenecks.",
      color: "amber",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics & AI 📊</h1>
        <p className="text-lg text-gray-600">
          Hiring pipeline insights and data-driven recommendations
        </p>
      </div>

      {/* KPI Cards - 6 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Applicants */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Total Applicants
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {stats.totalApplicants}
          </div>
          <div className="text-xs text-gray-600">
            All-time submissions
          </div>
        </div>

        {/* Open Jobs */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Open Positions
          </div>
          <div className="text-4xl font-bold text-indigo-600 mb-1">
            {stats.openJobs}
          </div>
          <div className="text-xs text-gray-600">
            Active job postings
          </div>
        </div>

        {/* Avg Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Avg Candidate Score
          </div>
          <div className="text-4xl font-bold text-blue-600 mb-1">
            {stats.avgScore}
          </div>
          <div className="text-xs text-gray-600">
            Out of 100
          </div>
        </div>

        {/* Shortlisted */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Shortlisted
          </div>
          <div className="text-4xl font-bold text-emerald-600 mb-1">
            {stats.shortlisted}
          </div>
          <div className="text-xs text-gray-600">
            Moving to interviews
          </div>
        </div>

        {/* Time to Fill */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Avg Time to Fill
          </div>
          <div className="text-4xl font-bold text-amber-600 mb-1">
            {stats.avgTimeToFill}
          </div>
          <div className="text-xs text-gray-600">
            Average duration
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Conversion Rate
          </div>
          <div className="text-4xl font-bold text-purple-600 mb-1">
            {stats.conversionRate}%
          </div>
          <div className="text-xs text-gray-600">
            Apply to shortlist
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Top Skills */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🔍</span> Top Skills in JDs
              </h2>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                From 0 JDs
              </span>
            </div>

            <div className="space-y-4">
              {topSkills.map((skill, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {skill.skill}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {skill.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Trends */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>📈</span> Applicants per Role
            </h2>

            <div className="space-y-4">
              {jobTrends.map((job, idx) => (
                <div key={idx} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {job.role}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-indigo-600">
                        {job.applicants} applicants
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">
                        {job.shortlisted} shortlisted
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (job.applicants / 40) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="w-20 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (job.shortlisted / 10) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-xs text-gray-700">Total Applicants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-700">Shortlisted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (1 col) */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>✨</span> AI Insights
            </h2>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`border-l-4 rounded-lg p-4 ${
                  insight.color === "emerald"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                    : insight.color === "blue"
                    ? "bg-blue-50 border-blue-500 text-blue-900"
                    : "bg-amber-50 border-amber-500 text-amber-900"
                }`}
              >
                <div className="text-2xl mb-2">{insight.icon}</div>
                <div className="font-semibold text-sm mb-1">{insight.title}</div>
                <div className="text-xs leading-relaxed opacity-90">
                  {insight.description}
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🚀</span> Next Steps
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-2 text-xs text-gray-700">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>Compare candidate skills vs. JD requirements</span>
              </li>
              <li className="flex gap-2 text-xs text-gray-700">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>Auto-suggest top candidates for each role</span>
              </li>
              <li className="flex gap-2 text-xs text-gray-700">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>Predict time-to-fill using trends</span>
              </li>
            </ul>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-sm font-bold text-indigo-900 mb-4">
              Pipeline Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-800">Conversion Rate</span>
                <span className="font-bold text-indigo-900">
                  {((stats.shortlisted / stats.totalApplicants) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-800">Avg per Role</span>
                <span className="font-bold text-indigo-900">
                  {(stats.totalApplicants / stats.openJobs).toFixed(0)} apps
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-800">Quality Score</span>
                <span className="font-bold text-indigo-900">{stats.avgScore}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Analytics.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="analytics">
      {page}
    </DashboardLayout>
  );
};

export default Analytics;