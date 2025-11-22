// pages/candidate/job-profiles.js
import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";

function CandidateJobProfiles() {
  const [tab, setTab] = useState("JOBS"); // "JOBS" | "APPS"
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]); // applications with joined job info
  const [query, setQuery] = useState("");
  const [loc, setLoc] = useState("");
  const [exp, setExp] = useState("");

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
          setJobs(jobsData.jobs || []);
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

  const apply = async (jobId) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 401) {
        alert("Not authenticated. Please log in again.");
        if (typeof window !== "undefined") {
          window.location.href = "/login?role=candidate";
        }
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to apply");

      if (data?.application) {
        setApps((prev) => [{ ...data.application }, ...prev]);
      }
      alert("Applied successfully!");
    } catch (e) {
      alert(e.message || "Something went wrong while applying.");
    }
  };

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
        <p className="text-lg text-gray-600 mt-2">Browse open roles or track your applications</p>
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
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
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
                  <p className="text-lg text-gray-600 font-medium">No jobs match your filters</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((j) => (
                    <JobCard
                      key={j.id}
                      job={j}
                      applied={appliedJobIds.has(j.id)}
                      onApply={() => apply(j.id)}
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
                  <p className="text-lg text-gray-600 font-medium">No applications yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start exploring and apply to jobs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apps.map((a) => (
                    <ApplicationRow key={a.id} app={a} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
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
            <h3 className="text-xl font-bold text-gray-900">
              {job.title}
            </h3>
            <p className="text-lg text-gray-600 font-semibold mt-1">
              {job.company}
            </p>
          </div>

          {/* Tech Stack */}
          {job.stack && (
            <p className="text-sm text-gray-600 mt-3 mb-4">
              {job.stack}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.location && (
              <Badge icon="📍">{job.location}</Badge>
            )}
            {job.experience && (
              <Badge icon="📊">{job.experience}</Badge>
            )}
            {job.salaryRange && (
              <Badge icon="💰">{job.salaryRange}</Badge>
            )}
            {job.createdAt && (
              <Badge icon="📅">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </Badge>
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

function ApplicationRow({ app }) {
  const job = app.job || {};
  const stageText = (s) => {
    if (s === 1) return "Resume / ATS Review";
    if (s === 2) return "Aptitude Test";
    if (s === 3) return "Interview";
    return `Stage ${s}`;
  };

  const stageIcon = (s) => {
    if (s === 1) return "📄";
    if (s === 2) return "✍️";
    if (s === 3) return "🎤";
    return "📌";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-6">
        {/* LEFT: Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900">
            {job.title}
          </h3>
          <p className="text-lg text-gray-600 font-semibold mt-1">
            {job.company}
          </p>

          {/* Job Details */}
          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            {job.location && <Badge icon="📍">{job.location}</Badge>}
            {job.experience && <Badge icon="📊">{job.experience}</Badge>}
            {job.salaryRange && <Badge icon="💰">{job.salaryRange}</Badge>}
            {job.stack && <Badge icon="⚙️">{job.stack}</Badge>}
            {app.createdAt && (
              <Badge icon="📅">
                Applied {new Date(app.createdAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>

        {/* RIGHT: Current Stage */}
        <div className="flex flex-col items-end gap-3 min-w-max">
          <div className="text-center">
            <div className="text-3xl mb-2">{stageIcon(app.stage)}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Current Stage
            </div>
            <div className="text-base font-bold text-gray-900 mt-2">
              {stageText(app.stage)}
            </div>
          </div>
          {app.id && (
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-200 w-full">
              ID: {String(app.id).slice(0, 8)}…
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

CandidateJobProfiles.getLayout = (page) => (
  <Layout role="CANDIDATE" active="jobs">
    {page}
  </Layout>
);

export default CandidateJobProfiles;