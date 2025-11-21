// pages/recruiter/job-profiles.js
// Jobs — unified light theme (JD section removed)

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import JobPostingsTable from "../../components/recruiter/JobPostingsTable";
import JobModal from "../../components/recruiter/JobModal";

function mapServerJobToTable(job) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salaryRange: job.salaryRange,
    experience: job.experience,
    deadline: job.deadline,
    description: job.description,
    jdFilePath: job.jdFilePath,
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

function JobProfiles() {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/jobs/my");
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Failed to load recruiter jobs");
      const mapped = (data.jobs || []).map(mapServerJobToTable);
      setJobs(mapped);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const onSaveJob = async (job) => {
    try {
      const payload = {
        title: job.title,
        company: job.company,
        location: job.location || "",
        salaryRange: job.salaryRange || "",
        experience: job.experience || "",
        deadline: job.deadline || "",
        description: job.description || "",
        jdFilePath: job.jdFilePath || "",
        status: job.status === "Open" ? "OPEN" : "CLOSED",
      };

      let res, data;
      if (job.id) {
        res = await fetch(`/api/jobs/${job.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Failed to save job posting");

      setJobModalOpen(false);
      setEditingJob(null);
      await loadJobs();
    } catch (e) {
      alert(e.message);
    }
  };

  const onDeleteJob = async (id) => {
    if (
      !window.confirm(
        "Delete this job posting? It will be removed for all candidates."
      )
    )
      return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Failed to delete job posting");
      await loadJobs();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Job Postings</h1>
        <p className="text-sm text-gray-500">
          Manage and track your active job openings in one place.
        </p>
      </header>

      {/* Job Postings only */}
      <JobPostingsTable
        jobs={jobs}
        loading={loadingJobs}
        onAddJob={() => {
          setEditingJob(null);
          setJobModalOpen(true);
        }}
        onEditJob={(j) => {
          setEditingJob(j);
          setJobModalOpen(true);
        }}
        onDeleteJob={onDeleteJob}
      />
      <JobModal
        open={jobModalOpen}
        initial={editingJob}
        onClose={() => {
          setJobModalOpen(false);
          setEditingJob(null);
        }}
        onSave={onSaveJob}
      />
    </div>
  );
}

JobProfiles.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="job-profiles">
      {page}
    </DashboardLayout>
  );
};

export default JobProfiles;
