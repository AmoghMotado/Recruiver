// pages/candidate/dashboard.js
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

function Skeleton({ height = 120 }) {
  return (
    <div
      className="card"
      style={{
        padding: 16,
        height,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 37%, rgba(255,255,255,0.03) 63%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.4s ease infinite",
        borderRadius: 16,
      }}
      aria-hidden
    />
  );
}

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atsScore, setAtsScore] = useState(72);
  const [mockSummary, setMockSummary] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [profileRes, jobsRes, appsRes, mockRes] = await Promise.all([
          fetch("/api/profile/candidate").catch(() => null),
          fetch("/api/jobs?limit=12").catch(() => null),
          fetch("/api/jobs/applied").catch(() => null),
          fetch("/api/mock-interview/summary").catch(() => null),
        ]);

        if (!alive) return;

        if (profileRes?.ok) {
          const profileData = await profileRes.json();
          setAtsScore(profileData.candidate?.atsScore || 72);
        }

        if (jobsRes?.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }

        if (appsRes?.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }

        if (mockRes?.ok) {
          const mockData = await mockRes.json();
          setMockSummary(mockData);
        }
      } catch (err) {
        console.error("Candidate dashboard load error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const appliedJobIds = new Set(applications.map((app) => app.jobId));
  const recommendedJobs = jobs.filter((job) => !appliedJobIds.has(job.id));

  const applicationsCount = applications.length;
  const mockAttempts = mockSummary?.totalAttempts || 0;

  return (
    <div className="space-y-6">
      {/* Top stats row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Resume ATS */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
            Resume ATS
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-2xl font-semibold">
              {loading ? (
                <span className="text-gray-400">--</span>
              ) : (
                <>
                  {atsScore}
                  <span className="text-sm opacity-60">%</span>
                </>
              )}
            </div>
            <a
              href="/candidate/resume-ats"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View details
            </a>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Optimise your resume for better matches.
          </p>
        </div>

        {/* Applications */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
            Applications
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-2xl font-semibold">
              {loading ? (
                <span className="text-gray-400">--</span>
              ) : (
                applicationsCount
              )}
            </div>
            <a
              href="/candidate/job-profiles"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all
            </a>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Jobs you&apos;ve applied to so far.
          </p>
        </div>

        {/* Recommended Jobs */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
            Recommended Jobs
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-2xl font-semibold">
              {loading ? (
                <span className="text-gray-400">--</span>
              ) : (
                recommendedJobs.length
              )}
            </div>
            <a
              href="/candidate/job-profiles"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all jobs
            </a>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Based on your profile and skills.
          </p>
        </div>

        {/* Mock Interviews */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
            Mock Interviews
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-2xl font-semibold">
              {loading ? (
                <span className="text-gray-400">--</span>
              ) : (
                mockAttempts
              )}
            </div>
            <a
              href="/candidate/ai-mock-interview"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View attempts
            </a>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Practice attempts completed.
          </p>
        </div>
      </section>

      {/* Middle row */}
      <section className="grid grid-cols-1 xl:grid-cols-[2.1fr_1.4fr] gap-4">
        {/* Recommended jobs list */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Recommended Jobs</h3>
              <p className="text-xs text-gray-500">
                Roles that closely align with your profile.
              </p>
            </div>
            <a
              href="/candidate/job-profiles"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all jobs
            </a>
          </div>

          <div className="mt-2 space-y-2">
            {loading ? (
              [1, 2].map((k) => <Skeleton key={k} height={72} />)
            ) : recommendedJobs.length === 0 ? (
              <div className="text-xs text-gray-500 py-3">
                No new jobs available. Check back later!
              </div>
            ) : (
              recommendedJobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 bg-white/70"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {job.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {job.company || "Company"}
                    </div>
                  </div>
                  <a
                    href="/candidate/job-profiles"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Applications summary */}
        <div className="card p-4 flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-sm">My Applications</h3>
            <p className="text-xs text-gray-500">
              Track where you stand in each process.
            </p>
          </div>

          {loading ? (
            <>
              <Skeleton height={60} />
              <Skeleton height={60} />
            </>
          ) : applications.length === 0 ? (
            <div className="text-xs text-gray-500 py-2">
              You haven&apos;t applied to any jobs yet.
            </div>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-gray-100 px-3 py-2.5 bg-white/70"
                >
                  <div className="text-sm font-semibold truncate">
                    {app.job?.title || "Job"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500 flex justify-between">
                    <span className="truncate">
                      {app.job?.company || "Company"}
                    </span>
                    <span>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom row */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 pb-4">
        {/* Detailed Resume ATS */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">Resume ATS</h3>
              <p className="text-xs text-gray-500">
                Improve alignment with required skills to raise your score.
              </p>
            </div>
            <a
              href="/candidate/resume-ats"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View details
            </a>
          </div>
          <div className="text-3xl font-semibold">
            {loading ? (
              <span className="text-gray-400">--</span>
            ) : (
              <>
                {atsScore}
                <span className="text-base opacity-60">%</span>
              </>
            )}
          </div>
        </div>

        {/* Mock Interview card */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">Mock Interview</h3>
              <p className="text-xs text-gray-500">
                Practice conversational interviews with AI.
              </p>
            </div>
            <a
              href="/candidate/ai-mock-interview"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View attempts
            </a>
          </div>

          {loading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : !mockSummary || mockSummary.totalAttempts === 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                You haven&apos;t completed any mock interview attempts yet.
              </p>
              <a
                href="/candidate/ai-mock-interview"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md"
                style={{
                  background: "linear-gradient(90deg, #4f46e5, #4f46e5)",
                }}
              >
                Take your first test
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-2xl font-semibold">
                {mockSummary.latestScore || 0}
                <span className="text-sm opacity-60"> / 100</span>
              </div>
              <p className="text-xs text-gray-500">
                Total attempts: <strong>{mockSummary.totalAttempts}</strong>
                <br />
                Average score:{" "}
                <strong>{mockSummary.averageScore || 0}</strong>
              </p>
              <a
                href="/candidate/ai-mock-interview"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md"
                style={{
                  background: "linear-gradient(90deg, #4f46e5, #4f46e5)",
                }}
              >
                Take another test
              </a>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="card p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm">Shortcuts</h3>
            <p className="text-xs text-gray-500">
              Jump directly to key actions.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/candidate/job-profiles"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs font-semibold hover:bg-gray-50"
            >
              Browse Jobs
            </a>
            <a
              href="/candidate/resume-ats"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs font-semibold hover:bg-gray-50"
            >
              Update Resume
            </a>
            <a
              href="/candidate/ai-mock-interview"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs font-semibold hover:bg-gray-50"
            >
              Mock Interview
            </a>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 0% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

CandidateDashboard.getLayout = (page) => (
  <DashboardLayout role="CANDIDATE" active="dashboard">
    {page}
  </DashboardLayout>
);

export default CandidateDashboard;
