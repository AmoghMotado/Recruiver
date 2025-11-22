// pages/candidate/job-profiles.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

/* --------- date helpers so we don't get "Invalid Date" --------- */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "object") {
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

function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CandidateJobProfiles() {
  const router = useRouter();

  const [tab, setTab] = useState("JOBS"); // "JOBS" | "APPS"
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]); // applications with joined job info
  const [query, setQuery] = useState("");
  const [loc, setLoc] = useState("");
  const [exp, setExp] = useState("");

  // apply modal state
  const [applyJob, setApplyJob] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);

  const openApplyModal = (job) => {
    setApplyJob(job);
    setApplyOpen(true);
  };

  const closeApplyModal = () => {
    setApplyOpen(false);
    setApplyJob(null);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/jobs?limit=100", {
            credentials: "include",
          }),
          fetch("/api/jobs/applied", {
            credentials: "include",
          }),
        ]);

        if (jobsRes.status === 401 || appsRes.status === 401) {
          if (!cancelled) {
            alert("Not authenticated. Please log in again.");
            if (typeof window !== "undefined") {
              window.location.href = "/login?role=candidate";
            }
          }
          return;
        }

        const jobsData = await jobsRes.json().catch(() => ({}));
        if (!jobsRes.ok) {
          throw new Error(jobsData?.message || "Failed to load jobs");
        }
        if (!cancelled) {
          // normalise job dates once here
          const mappedJobs = (jobsData.jobs || []).map((j) => ({
            ...j,
            createdAtLabel: formatShortDate(j.createdAt),
            deadlineLabel: formatDateTime(j.deadline),
          }));
          setJobs(mappedJobs);
        }

        if (appsRes.status === 404) {
          if (!cancelled) setApps([]);
        } else {
          const appsData = await appsRes.json().catch(() => ({}));
          if (!appsRes.ok) {
            throw new Error(
              appsData?.message || "Failed to load applications"
            );
          }
          if (!cancelled) {
            setApps(appsData.applications || []);
          }
        }
      } catch (e) {
        if (!cancelled) {
          alert(e.message || "Something went wrong while loading jobs.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const appliedJobIds = useMemo(
    () => new Set(apps.map((a) => a.jobId)),
    [apps]
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = query.trim().toLowerCase();
      const passQ =
        !q ||
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        (j.stack || "").toLowerCase().includes(q);

      const passLoc =
        !loc || (j.location || "").toLowerCase().includes(loc.toLowerCase());

      const passExp =
        !exp ||
        (j.experience || "").toLowerCase().includes(exp.toLowerCase());

      return passQ && passLoc && passExp;
    });
  }, [jobs, query, loc, exp]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <p className="text-lg text-gray-600 font-medium">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Job Opportunities</h1>
        <p className="text-lg text-gray-600 mt-2">
          Browse open roles or track your applications
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* LEFT SIDEBAR - FILTERS */}
        <aside className="bg-white rounded-xl border border-gray-200 p-8 h-fit">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setTab("JOBS")}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab === "JOBS"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Browse Jobs
            </button>
            <button
              onClick={() => setTab("APPS")}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab === "APPS"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              My Applications
            </button>
          </div>

          {/* Filters (only on JOBS tab) */}
          {tab === "JOBS" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Search
                </label>
                <input
                  placeholder="Role, company, stack…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 font-medium text-sm focus:border-indigo-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Location
                </label>
                <input
                  placeholder="e.g., Remote, Bangalore…"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 font-medium text-sm focus:border-indigo-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Experience Level
                </label>
                <input
                  placeholder="e.g., Junior, Senior…"
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 font-medium text-sm focus:border-indigo-400 focus:outline-none transition"
                />
              </div>

              {/* Results count */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 font-medium">
                  {filteredJobs.length} job
                  {filteredJobs.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT CONTENT */}
        <main className="space-y-6">
          {tab === "JOBS" ? (
            <>
              {filteredJobs.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg text-gray-600 font-medium">
                    No jobs match your filters
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your search criteria
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((j) => (
                    <JobCard
                      key={j.id}
                      job={j}
                      applied={appliedJobIds.has(j.id)}
                      onApply={() => openApplyModal(j)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {apps.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-lg text-gray-600 font-medium">
                    No applications yet
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start exploring and apply to jobs
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apps.map((a) => (
                    <ApplicationRow
                      key={a.id}
                      app={a}
                      onProceedToRound2={() =>
                        router.push(`/candidate/aptitude/${a.id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* APPLY MODAL – upload resume then apply */}
      <ApplyJobModal
        open={applyOpen}
        job={applyJob}
        onClose={closeApplyModal}
        onApplied={(newApps) => setApps(newApps)}
      />
    </div>
  );
}

function JobCard({ job, applied, onApply }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          {/* Job Title & Company */}
          <div className="mb-1">
            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
            <p className="text-lg text-gray-600 font-semibold mt-1">
              {job.company}
            </p>
          </div>

          {/* Tech Stack */}
          {job.stack && (
            <p className="text-sm text-gray-600 mt-3 mb-4">{job.stack}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.location && <Badge icon="📍">{job.location}</Badge>}
            {job.experience && <Badge icon="📊">{job.experience}</Badge>}
            {job.salaryRange && <Badge icon="💰">{job.salaryRange}</Badge>}
            {job.createdAtLabel && (
              <Badge icon="📅">Posted {job.createdAtLabel}</Badge>
            )}
            {job.deadlineLabel && (
              <Badge icon="⏰">Deadline {job.deadlineLabel}</Badge>
            )}
            {job.jdFilePath && (
              <a
                href={job.jdFilePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full text-sm font-semibold text-purple-700 hover:bg-purple-100"
              >
                📄 View JD
              </a>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={onApply}
          disabled={applied}
          className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
            applied
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg active:scale-95"
          }`}
        >
          {applied ? "✓ Applied" : "Apply Now"}
        </button>
      </div>
    </div>
  );
}

function ApplicationRow({ app, onProceedToRound2 }) {
  const job = app.job || {};

  const statusLabel = (() => {
    const s = app.status || "APPLIED";
    if (s === "SHORTLISTED") return "Shortlisted";
    if (s === "UNDER_REVIEW") return "Under Review";
    if (s === "REJECTED") return "Rejected";
    return "Applied";
  })();

  const statusSub = (() => {
    const stage = app.stage ?? 1;
    if (statusLabel === "Shortlisted") return "Aptitude Test";
    if (stage === 1) return "Resume / ATS Review";
    if (stage === 2) return "Aptitude Test";
    if (stage === 3) return "Interview";
    return "Application submitted";
  })();

  const canProceedToRound2 =
    (app.status === "SHORTLISTED" || app.status === "Shortlisted") &&
    (app.stage === 2 || app.stage === "2");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-6">
        {/* LEFT: Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
          <p className="text-lg text-gray-600 font-semibold mt-1">
            {job.company}
          </p>

          {/* Job Details */}
          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            {job.location && <Badge icon="📍">{job.location}</Badge>}
            {job.experience && <Badge icon="📊">{job.experience}</Badge>}
            {job.salaryRange && <Badge icon="💰">{job.salaryRange}</Badge>}
            {job.stack && <Badge icon="⚙️">{job.stack}</Badge>}
            {job.deadline && (
              <Badge icon="⏰">Deadline {formatDateTime(job.deadline)}</Badge>
            )}
            {job.jdFilePath && (
              <a
                href={job.jdFilePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full text-sm font-semibold text-purple-700 hover:bg-purple-100"
              >
                📄 View JD
              </a>
            )}
            {app.createdAt && (
              <Badge icon="📅">
                Applied {formatShortDate(app.createdAt)}
              </Badge>
            )}
          </div>
        </div>

        {/* RIGHT: Current Status */}
        <div className="flex flex-col items-end gap-3 min-w-[220px]">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <span className="text-lg">📄</span>
              <span>Current Status</span>
            </div>
            <div className="text-base font-extrabold text-gray-900 mt-2">
              {statusLabel}
            </div>
            <div className="text-xs text-gray-500 mt-1">{statusSub}</div>
          </div>

          {canProceedToRound2 && (
            <button
              onClick={onProceedToRound2}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-700 active:scale-95 transition"
            >
              Proceed to Round 2 (Aptitude Test)
            </button>
          )}

          {app.id && (
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-200 w-full text-right">
              ID: {String(app.id).slice(0, 10)}…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-full text-sm font-semibold text-indigo-700">
      {icon}
      {children}
    </span>
  );
}

/* ------------ Apply Job Modal: upload resume then apply ------------ */
function ApplyJobModal({ open, job, onClose, onApplied }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!open || !job) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      alert("Please upload a PDF, DOC or DOCX file");
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your resume first");
      return;
    }

    setUploading(true);
    try {
      // 1) upload resume
      const fd = new FormData();
      fd.append("resume", file);

      const upRes = await fetch("/api/jobs/upload-resume", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (upRes.status === 401) {
        alert("Not authenticated. Please log in again.");
        if (typeof window !== "undefined") {
          window.location.href = "/login?role=candidate";
        }
        return;
      }
      const upData = await upRes.json().catch(() => ({}));
      if (!upRes.ok) {
        throw new Error(upData?.message || "Failed to upload resume");
      }

      const resumePath = upData.filePath;

      // 2) apply to job with resumePath
      const applyRes = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumePath }),
      });

      if (applyRes.status === 401) {
        alert("Not authenticated. Please log in again.");
        if (typeof window !== "undefined") {
          window.location.href = "/login?role=candidate";
        }
        return;
      }

      const applyData = await applyRes.json().catch(() => ({}));
      if (!applyRes.ok) {
        throw new Error(applyData?.message || "Failed to apply");
      }

      // 3) refresh applications list so "My Applications" is up to date
      if (onApplied) {
        const appsRes = await fetch("/api/jobs/applied", {
          credentials: "include",
        });
        if (appsRes.ok) {
          const appsData = await appsRes.json().catch(() => ({}));
          onApplied(appsData.applications || []);
        }
      }

      alert("Application submitted!");
      onClose();
    } catch (err) {
      alert(err.message || "Something went wrong while applying.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl border border-gray-200 p-6 shadow-2xl space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Apply to {job.title}
        </h2>
        <p className="text-sm text-gray-600">
          Upload your latest resume before submitting your application.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Resume (PDF / DOC / DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {file && (
              <p className="text-xs text-emerald-600 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn ghost flex-1"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn flex-1"
              disabled={uploading}
            >
              {uploading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

CandidateJobProfiles.getLayout = (page) => (
  <Layout role="CANDIDATE" active="job-profiles">
    {page}
  </Layout>
);

export default CandidateJobProfiles;
