// pages/recruiter/dashboard.js
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import JobPostingsTable from "@/components/recruiter/JobPostingsTable";
import CandidatesTable from "@/components/recruiter/CandidatesTable";
import AnalyticsPanel from "@/components/recruiter/AnalyticsPanel";
import CalendarWidget from "@/components/recruiter/CalendarWidget";

function mapServerJobToTable(job) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    applicants: job.applicantsCount ?? (job.applications?.length || 0),
    status: job.status === "OPEN" ? "Open" : "Closed",
    updated: job.updatedAt
      ? new Date(job.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "",
  };
}

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({ q: "", status: "All", minScore: 0 });

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/jobs/my");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load jobs");
      const mapped = (data.jobs || []).map(mapServerJobToTable);
      setJobs(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplicants = async () => {
    setLoadingApplicants(true);
    try {
      const res = await fetch("/api/jobs/applicants");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load applicants");
      setApplicants(data.applicants || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadApplicants();
  }, []);

  const totals = {
    applicants: applicants.length || 0,
    jobs: jobs.length || 0,
    shortlisted:
      applicants.filter((a) => a.status === "Shortlisted").length || 0,
    events: 8,
  };

  const handleToggle = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleToggleAll = (ids, checked) => {
    if (checked) {
      setSelectedIds(new Set([...selectedIds, ...ids]));
    } else {
      const next = new Set(selectedIds);
      ids.forEach((id) => next.delete(id));
      setSelectedIds(next);
    }
  };

  const handleViewResume = (candidate) => {
    alert(`View resume for ${candidate.name} (stub)`);
  };

  const handleChangeStatus = (id, newStatus) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const handleBulk = (action) => {
    const ids = Array.from(selectedIds);
    if (action === "review") {
      setApplicants((prev) =>
        prev.map((a) =>
          ids.includes(a.id) ? { ...a, status: "Under Review" } : a
        )
      );
    } else if (action === "shortlist") {
      setApplicants((prev) =>
        prev.map((a) =>
          ids.includes(a.id) ? { ...a, status: "Shortlisted" } : a
        )
      );
    } else if (action === "reject") {
      setApplicants((prev) =>
        prev.map((a) =>
          ids.includes(a.id) ? { ...a, status: "Rejected" } : a
        )
      );
    } else if (action === "delete") {
      if (window.confirm(`Delete ${ids.length} candidate(s)?`)) {
        setApplicants((prev) => prev.filter((a) => !ids.includes(a.id)));
      }
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Stats Cards - 4 Columns */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Applicants */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Total Applicants
          </div>
          <div className="text-5xl font-bold text-gray-900 mt-4">
            {loadingApplicants ? (
              <span className="text-gray-300">--</span>
            ) : (
              totals.applicants
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600 font-medium">
            Candidates applied across all jobs
          </p>
          <a
            href="/recruiter/candidates"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            View All →
          </a>
        </div>

        {/* Active Job Posts */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Active Job Posts
          </div>
          <div className="text-5xl font-bold text-gray-900 mt-4">
            {loadingJobs ? (
              <span className="text-gray-300">--</span>
            ) : (
              totals.jobs
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600 font-medium">
            Open positions available
          </p>
          <a
            href="/recruiter/jobs"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            Manage Jobs →
          </a>
        </div>

        {/* Shortlisted Candidates */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Shortlisted Candidates
          </div>
          <div className="text-5xl font-bold text-gray-900 mt-4">
            {loadingApplicants ? (
              <span className="text-gray-300">--</span>
            ) : (
              totals.shortlisted
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600 font-medium">
            Ready for interview stage
          </p>
          <a
            href="/recruiter/candidates"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            Review Candidates →
          </a>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Upcoming Events
          </div>
          <div className="text-5xl font-bold text-gray-900 mt-4">
            {totals.events}
          </div>
          <p className="mt-3 text-sm text-gray-600 font-medium">
            Scheduled interviews & meetings
          </p>
          <a
            href="/recruiter/calendar"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            View Calendar →
          </a>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Jobs & Candidates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Postings Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Job Postings
                </h2>
                <p className="text-base text-gray-600 mt-1">
                  Manage your open positions
                </p>
              </div>
              <button
                onClick={() => (location.href = "/recruiter/jobs")}
                className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:shadow-lg transition"
              >
                + Post New Job
              </button>
            </div>

            <JobPostingsTable
              jobs={jobs}
              loading={loadingJobs}
              onAddJob={() => (location.href = "/recruiter/jobs")}
              onEditJob={() => (location.href = "/recruiter/jobs")}
              onDeleteJob={() => (location.href = "/recruiter/jobs")}
            />
          </div>

          {/* Candidates Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
              <p className="text-base text-gray-600 mt-1">
                Review and manage your applicants
              </p>
            </div>

            <CandidatesTable
              rows={applicants}
              loading={loadingApplicants}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              onViewResume={handleViewResume}
              onChangeStatus={handleChangeStatus}
              onBulk={handleBulk}
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </div>

        {/* Right Column - Analytics & Calendar */}
        <div className="space-y-6">
          {/* Analytics Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              AI & Analytics
            </h2>
            <AnalyticsPanel />
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h2>
            <CalendarWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

RecruiterDashboard.getLayout = (page) => (
  <DashboardLayout role="RECRUITER" active="dashboard">
    {page}
  </DashboardLayout>
);

export default RecruiterDashboard;
