// pages/recruiter/job-profiles.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import JobPostingsTable from "@/components/recruiter/JobPostingsTable";
import JobModal from "@/components/recruiter/JobModal";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Firestore Timestamp (client or admin) support
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const d = value.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const sec = value.seconds ?? value._seconds;
    if (typeof sec === "number") return new Date(sec * 1000);
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatShortDate(value) {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapServerJobToTable(job) {
  const deadlineDate = toDate(job.deadline);
  const createdAtDate = toDate(job.createdAt);
  const updatedAtDate = toDate(job.updatedAt);

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salaryRange: job.salaryRange,
    experience: job.experience,
    // pretty date for table
    deadline: deadlineDate ? formatShortDate(deadlineDate) : "",
    // raw value passed into the modal so it can build datetime-local string
    rawDeadline: job.deadline || null,
    description: job.description,
    jdFilePath: job.jdFilePath,
    applicants: job.applicantsCount ?? (job.applications?.length || 0),
    status: job.status === "OPEN" || job.status === "Open" ? "Open" : "Closed",
    updated: updatedAtDate ? formatShortDate(updatedAtDate) : "",
    createdAt: createdAtDate ? formatShortDate(createdAtDate) : "",
  };
}

function JobProfiles() {
  const router = useRouter();

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
        // datetime-local string goes straight to backend
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

  const totalApplicants = jobs.reduce(
    (sum, j) => sum + (j.applicants || 0),
    0
  );
  const activeJobs = jobs.filter((j) => j.status === "Open").length;

  // NEW: when recruiter clicks "Configure Aptitude Test"
  const handleConfigureAptitude = (job) => {
    if (!job?.id) return;
    router.push(`/recruiter/aptitude/${job.id}`);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Job Postings 💼
        </h1>
        <p className="text-lg text-gray-600">
          Manage and track your active job openings in one place
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Total Openings
          </div>
          <div className="text-3xl font-bold text-gray-900">{jobs.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Active Jobs
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {activeJobs}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Total Applicants
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {totalApplicants}
          </div>
        </div>
      </div>

      {/* Job Postings Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Positions</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and manage all your job postings
            </p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null);
              setJobModalOpen(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <span>+</span> Create Job Posting
          </button>
        </div>

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
          // ✨ NEW: opens the Aptitude Editor for this job
          onConfigureAptitude={handleConfigureAptitude}
        />
      </div>

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
