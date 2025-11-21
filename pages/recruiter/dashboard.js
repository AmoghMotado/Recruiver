// pages/recruiter/dashboard.js
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCards from "@/components/recruiter/StatsCards";
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
    // TODO: Update via API
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
    <div className="space-y-6">
      <StatsCards totals={totals} />

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <JobPostingsTable
            jobs={jobs}
            loading={loadingJobs}
            onAddJob={() => (location.href = "/recruiter/job-profiles")}
            onEditJob={() => (location.href = "/recruiter/job-profiles")}
            onDeleteJob={() => (location.href = "/recruiter/job-profiles")}
          />

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

        <div className="space-y-6">
          <AnalyticsPanel />
          <CalendarWidget />
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
