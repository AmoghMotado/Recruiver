// components/recruiter/RealTimeDataPanel.js
import { useMemo } from "react";

export default function RealTimeDataPanel({ applicants = [], jobs = [], loading = false }) {
  
  // Calculate this week's stats
  const thisWeekStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newApplications = applicants.filter((app) => {
      if (!app.appliedDate) return false;
      const appliedTime = app.appliedDate._seconds 
        ? app.appliedDate._seconds * 1000 
        : new Date(app.appliedDate).getTime();
      return appliedTime >= weekAgo.getTime();
    }).length;

    const pendingReview = applicants.filter(
      (app) => app.status === "APPLIED" || app.status === "UNDER_REVIEW"
    ).length;

    const interviewsScheduled = applicants.filter(
      (app) => app.status === "HR_SCHEDULED"
    ).length;

    const shortlistedThisWeek = applicants.filter((app) => {
      if (app.status !== "SHORTLISTED") return false;
      // Could add date filtering here if you track status change dates
      return true;
    }).length;

    return {
      newApplications,
      pendingReview,
      interviewsScheduled,
      shortlistedThisWeek,
    };
  }, [applicants]);

  // Get most active jobs (by applicant count)
  const hotJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => (b.applicants || 0) - (a.applicants || 0))
      .slice(0, 3);
  }, [jobs]);

  // Get recent activity (last 5 applicants)
  const recentActivity = useMemo(() => {
    return [...applicants]
      .sort((a, b) => {
        const timeA = a.appliedDate?._seconds 
          ? a.appliedDate._seconds * 1000 
          : new Date(a.appliedDate || 0).getTime();
        const timeB = b.appliedDate?._seconds 
          ? b.appliedDate._seconds * 1000 
          : new Date(b.appliedDate || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [applicants]);

  // Calculate time ago
  const timeAgo = (date) => {
    if (!date) return "Recently";
    const time = date._seconds ? date._seconds * 1000 : new Date(date).getTime();
    const now = Date.now();
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* This Week Stats */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <span>📊</span> This Week
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-900">
              +{thisWeekStats.newApplications}
            </div>
            <div className="text-xs text-indigo-700 font-medium mt-1">
              New Applications
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl font-bold text-amber-900">
              {thisWeekStats.pendingReview}
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">
              Pending Review
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl font-bold text-emerald-900">
              {thisWeekStats.interviewsScheduled}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              Interviews Scheduled
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-900">
              {thisWeekStats.shortlistedThisWeek}
            </div>
            <div className="text-xs text-purple-700 font-medium mt-1">
              Shortlisted
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>🔔</span> Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            No recent activity
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((app, idx) => (
              <div
                key={app.applicationId || idx}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {(app.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {app.name || "Unknown Candidate"}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Applied to <span className="font-medium">{app.jobTitle || "Position"}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {timeAgo(app.appliedDate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hot Jobs (Most Active) */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>🔥</span> Most Active Jobs
        </h3>
        {hotJobs.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            No jobs posted yet
          </div>
        ) : (
          <div className="space-y-2">
            {hotJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {job.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {job.company || "Your Company"}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-xs font-semibold text-gray-500">
                    {job.applicants || 0}
                  </span>
                  <span className="text-lg">👥</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => (window.location.href = "/recruiter/candidates")}
            className="w-full flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-left"
          >
            <span className="text-sm font-semibold">Review Pending Applications</span>
            {thisWeekStats.pendingReview > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full">
                {thisWeekStats.pendingReview}
              </span>
            )}
          </button>

          <button
            onClick={() => (window.location.href = "/recruiter/jobs")}
            className="w-full flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-left"
          >
            <span className="text-sm font-semibold">Post New Job</span>
            <span className="text-lg">➕</span>
          </button>

          <button
            onClick={() => (window.location.href = "/recruiter/analytics")}
            className="w-full flex items-center justify-between p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <span className="text-sm font-semibold">View Analytics Dashboard</span>
            <span className="text-lg">📊</span>
          </button>
        </div>
      </div>

      {/* Pipeline Health Indicator */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✅</span>
          <h3 className="text-sm font-bold text-emerald-900">
            Pipeline Health
          </h3>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          {thisWeekStats.newApplications > 0 
            ? `Good flow with ${thisWeekStats.newApplications} new application${thisWeekStats.newApplications === 1 ? '' : 's'} this week. Keep up the momentum!`
            : "No new applications this week. Consider promoting your job postings or posting new positions."
          }
        </p>
      </div>

    </div>
  );
}