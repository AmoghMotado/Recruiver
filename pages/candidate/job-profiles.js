// pages/candidate/job-profiles.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

/* --------- Date Helpers --------- */
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

/* --------- Main Component --------- */
function CandidateJobProfiles() {
  const router = useRouter();

  const [tab, setTab] = useState("JOBS"); // "JOBS" | "APPS"
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [query, setQuery] = useState("");
  const [loc, setLoc] = useState("");
  const [exp, setExp] = useState("");

  // Apply modal state
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
          fetch("/api/jobs?limit=100", { credentials: "include" }),
          fetch("/api/jobs/applied", { credentials: "include" }),
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
          const mappedJobs = (jobsData.jobs || []).map((j) => ({
            ...j,
            createdAtLabel: formatShortDate(j.createdAt),
            deadlineLabel: formatDateTime(j.deadline),
          }));
          setJobs(mappedJobs);
        }

        // Applications
        if (appsRes.status === 404) {
          if (!cancelled) setApps([]);
        } else {
          const appsData = await appsRes.json().catch(() => ({}));
          if (!appsRes.ok) {
            throw new Error(appsData?.message || "Failed to load applications");
          }
          if (!cancelled) {
            // Drop applications whose job has been deleted/missing
            const validApps = (appsData.applications || []).filter((a) => a.job);
            setApps(validApps);
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
        !exp || (j.experience || "").toLowerCase().includes(exp.toLowerCase());

      return passQ && passLoc && passExp;
    });
  }, [jobs, query, loc, exp]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Finding the best roles for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 pt-6"> {/* Added pt-6 for a little top spacing since title is gone */}
      
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        
        {/* LEFT SIDEBAR - FILTERS & TABS */}
        <aside className="h-fit lg:sticky lg:top-4 space-y-6">
          
          {/* Tab Switcher */}
          <div className="bg-gray-100/80 p-1.5 rounded-xl flex shadow-inner">
            <button
              onClick={() => setTab("JOBS")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                tab === "JOBS"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Browse Jobs
            </button>
            <button
              onClick={() => setTab("APPS")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                tab === "APPS"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Applications
            </button>
          </div>

          {/* Filters Panel (Only for JOBS) */}
          {tab === "JOBS" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-lg">⚡</span>
                <h3 className="font-bold text-gray-900">Filters</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Keywords
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    <input
                      placeholder="Role, stack, company..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Location
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">📍</span>
                    <input
                      placeholder="e.g. Remote, Pune"
                      value={loc}
                      onChange={(e) => setLoc(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Experience
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">💼</span>
                    <input
                      placeholder="e.g. Fresher, 2 years"
                      value={exp}
                      onChange={(e) => setExp(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 text-center">
                    Showing {filteredJobs.length} results
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT CONTENT - GRID LIST */}
        <main>
          {tab === "JOBS" ? (
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <EmptyState
                  icon="🔍"
                  title="No jobs found"
                  subtitle="Try adjusting your filters to find what you're looking for."
                />
              ) : (
                filteredJobs.map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    applied={appliedJobIds.has(j.id)}
                    onApply={() => openApplyModal(j)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {apps.length === 0 ? (
                <EmptyState
                  icon="📂"
                  title="No applications yet"
                  subtitle="Start browsing jobs and apply to track your progress here."
                />
              ) : (
                apps.map((a) => <ApplicationRow key={a.id} app={a} />)
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL */}
      <ApplyJobModal
        open={applyOpen}
        job={applyJob}
        onClose={closeApplyModal}
        onApplied={(newApps) => setApps(newApps.filter((a) => a.job))}
      />
    </div>
  );
}

/* --------- Components --------- */

function JobCard({ job, applied, onApply }) {
  // Generate a placeholder logo color based on company name length
  const colors = ["bg-blue-100 text-blue-600", "bg-purple-100 text-purple-600", "bg-emerald-100 text-emerald-600", "bg-orange-100 text-orange-600"];
  const colorClass = colors[(job.company?.length || 0) % colors.length];

  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
      <div className="flex flex-col sm:flex-row gap-6">
        
        {/* Logo Placeholder */}
        <div className={`hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${colorClass} text-2xl font-bold`}>
          {job.company?.charAt(0) || "C"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-sm font-semibold text-gray-500 mt-1">{job.company}</p>
            </div>
            {/* Mobile Logo */}
            <div className={`sm:hidden h-10 w-10 flex items-center justify-center rounded-xl ${colorClass} text-lg font-bold`}>
                {job.company?.charAt(0) || "C"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {job.location && <Badge icon="📍" text={job.location} />}
            {job.experience && <Badge icon="💼" text={job.experience} />}
            {job.salaryRange && <Badge icon="💰" text={job.salaryRange} />}
            {job.stack && <Badge icon="🛠️" text={job.stack} />}
            {job.createdAtLabel && <Badge icon="📅" text={`Posted ${job.createdAtLabel}`} variant="gray" />}
          </div>
        </div>

        {/* Actions Column */}
        <div className="flex flex-col items-end justify-between gap-4 sm:border-l sm:border-gray-100 sm:pl-6 sm:w-40">
           
           {/* Deadline */}
          {job.deadlineLabel && (
            <div className="text-xs text-right text-gray-400 font-medium">
              Ends {job.deadlineLabel}
            </div>
          )}

          <div className="flex flex-col gap-2 w-full mt-auto">
            {job.jdFilePath && (
              <a
                href={job.jdFilePath}
                target="_blank"
                rel="noreferrer"
                className="w-full text-center py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                View JD
              </a>
            )}
            <button
              onClick={onApply}
              disabled={applied}
              className={`w-full py-2.5 rounded-lg text-sm font-bold shadow-md transition-all transform active:scale-95 ${
                applied
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg hover:from-indigo-500 hover:to-indigo-600"
              }`}
            >
              {applied ? "Applied" : "Apply Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationRow({ app }) {
  const router = useRouter();
  const job = app.job || {};
  const stage = typeof app.stage === "number" ? app.stage : 0;

  // Status Logic
  const statusLabel = (() => {
    const s = app.status || "APPLIED";
    if (s === "APPLIED") return "Applied";
    if (s === "UNDER_REVIEW") return "Under Review";
    if (s === "SHORTLISTED") {
      if (stage === 1) return "Round 1: Aptitude";
      if (stage === 2) return "Round 2: Interview";
      if (stage === 3) return "Final Selection";
      return "Shortlisted";
    }
    if (s === "HR_SCHEDULED") return "HR Round";
    if (s === "REJECTED") return "Not Selected";
    return s.replace("_", " ");
  })();

  const statusColor = (() => {
    const s = app.status || "APPLIED";
    if (s === "REJECTED") return "bg-red-50 text-red-600 border-red-100";
    if (s === "SHORTLISTED" || s === "HR_SCHEDULED") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-blue-50 text-blue-600 border-blue-100";
  })();

  const statusSub = (() => {
    const s = app.status || "APPLIED";
    if (s === "REJECTED") return "Better luck next time";
    if (stage === 1 && s === "SHORTLISTED") return "Aptitude Test Unlocked";
    if (stage === 2 && s === "SHORTLISTED") return "Video Interview Unlocked";
    if (stage === 3) return "HR Interview Scheduled";
    return "Application under review";
  })();

  // Logic for enabling buttons
  const canTakeAptitude = stage === 1 && (app.status === "SHORTLISTED" || app.status === "Shortlisted");
  const canTakeVideo = stage === 2 && (app.status === "SHORTLISTED" || app.status === "Shortlisted");
  const hrRound = app.hrRound || null;

  const handleAptitude = () => app.id && router.push(`/candidate/aptitude/${encodeURIComponent(app.id)}`);
  const handleVideoInterview = () => app.id && router.push(`/candidate/video-interview/start?applicationId=${encodeURIComponent(app.id)}`);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Job Info */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
          <p className="text-gray-500 font-medium">{job.company}</p>
          
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
             <span className="bg-gray-100 px-2 py-1 rounded">📍 {job.location || 'Remote'}</span>
             <span className="bg-gray-100 px-2 py-1 rounded">📅 Applied: {formatShortDate(app.createdAt)}</span>
          </div>

          {/* HR Details (if available) */}
          {stage === 3 && hrRound?.scheduled && (
             <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm">
                <p className="font-bold text-indigo-900 flex items-center gap-2">📅 HR Round Scheduled</p>
                <div className="text-indigo-700 mt-1 space-y-1 text-xs">
                   {hrRound.scheduledAt && <p>Time: {formatDateTime(hrRound.scheduledAt)}</p>}
                   {hrRound.location && <p>Location: {hrRound.location}</p>}
                </div>
             </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="w-full md:w-64 flex flex-col gap-3">
          
          {/* Status Badge */}
          <div className={`rounded-xl border px-4 py-3 text-center ${statusColor}`}>
             <div className="text-xs font-bold uppercase tracking-wide opacity-70">Status</div>
             <div className="font-bold text-lg">{statusLabel}</div>
             <div className="text-xs mt-1 font-medium">{statusSub}</div>
          </div>

          {/* Action Buttons */}
          {canTakeAptitude && (
            <button
              onClick={handleAptitude}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>📝</span> Start Aptitude Test
            </button>
          )}

          {canTakeVideo && (
            <button
              onClick={handleVideoInterview}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>🎥</span> Start Interview
            </button>
          )}
          
          {!canTakeAptitude && !canTakeVideo && app.status !== "REJECTED" && (
            <div className="text-center text-xs text-gray-400 font-medium py-2">
               No pending actions
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Badge({ icon, text, variant = "indigo" }) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[variant] || styles.indigo}`}>
      <span className="opacity-70">{icon}</span> {text}
    </span>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center flex flex-col items-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm mt-1 max-w-xs">{subtitle}</p>
    </div>
  );
}

/* --------- Apply Modal --------- */
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
      const fd = new FormData();
      fd.append("resume", file);

      const upRes = await fetch("/api/jobs/upload-resume", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      
      if (upRes.status === 401) {
         window.location.href = "/login?role=candidate";
         return;
      }
      const upData = await upRes.json().catch(() => ({}));
      if (!upRes.ok) throw new Error(upData?.message || "Failed to upload resume");

      const resumePath = upData.filePath;

      const applyRes = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumePath }),
      });

      if (applyRes.status === 401) {
         window.location.href = "/login?role=candidate";
         return;
      }
      const applyData = await applyRes.json().catch(() => ({}));
      if (!applyRes.ok) throw new Error(applyData?.message || "Failed to apply");

      if (onApplied) {
        const appsRes = await fetch("/api/jobs/applied", { credentials: "include" });
        if (appsRes.ok) {
          const appsData = await appsRes.json().catch(() => ({}));
          const validApps = (appsData.applications || []).filter((a) => a.job);
          onApplied(validApps);
        }
      }

      alert("Application submitted successfully!");
      onClose();
    } catch (err) {
      alert(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
          <h2 className="text-xl font-bold">Apply to {job.title}</h2>
          <p className="text-indigo-100 text-sm mt-1">{job.company}</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Upload Resume
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  <div className="text-3xl mb-2">{file ? '📄' : '☁️'}</div>
                  <p className="text-sm font-medium text-gray-600 truncate px-4">
                    {file ? file.name : "Click or drag to upload PDF/DOC"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
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