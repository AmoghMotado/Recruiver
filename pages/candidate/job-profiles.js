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
            credentials: "include", // ensure cookies are sent
          }),
          fetch("/api/jobs/applied", {
            credentials: "include",
          }),
        ]);

        // If either endpoint says "not authenticated", redirect to login.
        if (jobsRes.status === 401 || appsRes.status === 401) {
          if (!cancelled) {
            alert("Not authenticated. Please log in again.");
            if (typeof window !== "undefined") {
              window.location.href = "/login?role=candidate";
            }
          }
          return;
        }

        // Jobs
        const jobsData = await jobsRes.json().catch(() => ({}));
        if (!jobsRes.ok) {
          throw new Error(jobsData?.message || "Failed to load jobs");
        }
        if (!cancelled) {
          setJobs(jobsData.jobs || []);
        }

        // Applications
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
      <div className="card p-5">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* LEFT FILTERS / TABS */}
      <aside className="card p-5 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            Job Profiles
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Browse open roles or track your applications.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={`btn text-xs ${
              tab === "JOBS" ? "" : "ghost"
            } w-full justify-center`}
            onClick={() => setTab("JOBS")}
          >
            Browse Jobs
          </button>
          <button
            className={`btn text-xs ${
              tab === "APPS" ? "" : "ghost"
            } w-full justify-center`}
            onClick={() => setTab("APPS")}
          >
            My Applications
          </button>
        </div>

        {tab === "JOBS" && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1">
                Search
              </div>
              <input
                placeholder="Role, company, stack"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Location"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Experience"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        )}
      </aside>

      {/* RIGHT CONTENT */}
      <main className="flex flex-col gap-4">
        {tab === "JOBS" ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900">
              Open Roles
            </h2>
            {filteredJobs.length === 0 && (
              <div className="card p-4 text-sm text-slate-500">
                No jobs match your filters.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredJobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  applied={appliedJobIds.has(j.id)}
                  onApply={() => apply(j.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900">
              My Applications
            </h2>
            {apps.length === 0 && (
              <div className="card p-4 text-sm text-slate-500">
                You haven&apos;t applied to any jobs yet.
              </div>
            )}
            <div className="grid gap-3">
              {apps.map((a) => (
                <ApplicationRow key={a.id} app={a} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  color: "#111827",
  fontSize: 13,
};

function JobCard({ job, applied, onApply }) {
  return (
    <div className="card p-4">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">
            {job.title} — {job.company}
          </div>
          <div className="text-xs text-slate-500">{job.stack}</div>
          <div className="flex flex-wrap gap-2 mt-1 text-xs">
            {job.location && <span className="pill">{job.location}</span>}
            {job.salaryRange && <span className="pill">{job.salaryRange}</span>}
            {job.experience && <span className="pill">{job.experience}</span>}
            <span className="pill">
              Posted:{" "}
              {job.createdAt
                ? new Date(job.createdAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <button
            className={`btn text-xs ${applied ? "ghost" : ""}`}
            onClick={onApply}
            disabled={applied}
          >
            {applied ? "Applied" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationRow({ app }) {
  const job = app.job || {};
  const stageText = (s) => {
    if (s === 1) return "R1 · Resume / ATS";
    if (s === 2) return "R2 · Aptitude";
    if (s === 3) return "R3 · Interview";
    return `Stage ${s}`;
  };

  return (
    <div className="card p-4 flex justify-between items-stretch gap-4">
      {/* LEFT: job info */}
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-900">
          {job.title} — {job.company}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {job.location} · {job.experience} · {job.salaryRange}
        </div>
        <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
          {job.stack && <span className="pill">{job.stack}</span>}
          <span className="pill">
            Applied on{" "}
            {app.createdAt
              ? new Date(app.createdAt).toLocaleDateString()
              : "—"}
          </span>
        </div>
      </div>

      {/* RIGHT: stage + status */}
      <div className="min-w-[180px] pl-4 border-l border-slate-200 flex flex-col justify-center text-right gap-1">
        <div className="text-[11px] text-slate-500 uppercase tracking-wide">
          Current Stage
        </div>
        <div className="text-sm font-semibold text-slate-900">
          {stageText(app.stage)}
        </div>
        {app.id && (
          <div className="text-[11px] text-slate-400">
            Application ID: {String(app.id).slice(0, 8)}…
          </div>
        )}
      </div>
    </div>
  );
}

CandidateJobProfiles.getLayout = (page) => (
  <Layout role="CANDIDATE" active="jobs">
    {page}
  </Layout>
);

export default CandidateJobProfiles;
