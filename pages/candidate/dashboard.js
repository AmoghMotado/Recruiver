// pages/candidate/dashboard.js
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

function Skeleton({ height = 120 }) {
  return (
    <div
      className="card"
      style={{
        padding: 20,
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
    <div className="space-y-8 pb-8">
      {/* Top KPI Row - 4 Columns */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Resume ATS */}
        <div className="card p-8 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Resume ATS Score
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="text-5xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-300">--</span>
                ) : (
                  <>
                    {atsScore}
                    <span className="text-2xl opacity-70 font-semibold">%</span>
                  </>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-600 font-medium">
                Optimise for better matches
              </p>
            </div>
          </div>
          <a
            href="/candidate/resume-ats"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            View Analysis →
          </a>
        </div>

        {/* Applications */}
        <div className="card p-8 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Applications
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="text-5xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-300">--</span>
                ) : (
                  applicationsCount
                )}
              </div>
              <p className="mt-3 text-sm text-gray-600 font-medium">
                Jobs applied so far
              </p>
            </div>
          </div>
          <a
            href="/candidate/job-profiles"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            View All →
          </a>
        </div>

        {/* Recommended Jobs */}
        <div className="card p-8 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Recommended Jobs
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="text-5xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-300">--</span>
                ) : (
                  recommendedJobs.length
                )}
              </div>
              <p className="mt-3 text-sm text-gray-600 font-medium">
                Matching your profile
              </p>
            </div>
          </div>
          <a
            href="/candidate/job-profiles"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            Browse Jobs →
          </a>
        </div>

        {/* Mock Interviews */}
        <div className="card p-8 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Mock Interviews
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="text-5xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-300">--</span>
                ) : (
                  mockAttempts
                )}
              </div>
              <p className="mt-3 text-sm text-gray-600 font-medium">
                Practice attempts
              </p>
            </div>
          </div>
          <a
            href="/candidate/ai-mock-interview"
            className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            View Attempts →
          </a>
        </div>
      </section>

      {/* Main Content - 2 Columns */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Jobs - Larger Card */}
        <div className="lg:col-span-2 card p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recommended Opportunities
              </h2>
              <p className="text-base text-gray-600 mt-1">
                Roles aligned with your skills and experience
              </p>
            </div>
            <a
              href="/candidate/job-profiles"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition whitespace-nowrap"
            >
              View All Jobs →
            </a>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              [1, 2, 3].map((k) => <Skeleton key={k} height={100} />)
            ) : recommendedJobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-xl">
                <p className="text-lg text-gray-600 font-medium">
                  No new jobs available right now
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Check back soon for opportunities
                </p>
              </div>
            ) : (
              recommendedJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-6 py-5 bg-white/80 hover:bg-white hover:border-indigo-200 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-gray-900 truncate">
                      {job.title}
                    </div>
                    <div className="text-base text-gray-600 truncate mt-1">
                      {job.company || "Company Name"}
                    </div>
                  </div>
                  <a
                    href="/candidate/job-profiles"
                    className="ml-4 px-5 py-2.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition whitespace-nowrap"
                  >
                    View Job
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Applications */}
        <div className="card p-8 flex flex-col gap-4">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              My Applications
            </h2>
            <p className="text-base text-gray-600 mt-1">
              Track your application progress
            </p>
          </div>

          {loading ? (
            <>
              <Skeleton height={90} />
              <Skeleton height={90} />
              <Skeleton height={90} />
            </>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-gray-50/50 rounded-xl">
              <p className="text-lg text-gray-600 font-medium">
                No applications yet
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Start exploring opportunities
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 6).map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-gray-200 px-5 py-4 bg-white/80 hover:bg-white hover:border-indigo-200 transition"
                >
                  <div className="text-base font-bold text-gray-900 truncate">
                    {app.job?.title || "Job"}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 flex justify-between">
                    <span className="truncate font-medium">
                      {app.job?.company || "Company"}
                    </span>
                    <span className="text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Section - Features */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Interview Feature */}
        <div className="card p-8 flex flex-col justify-between bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              AI Mock Interviews
            </h2>
            <p className="text-base text-gray-600 mt-2">
              Practice with AI-powered conversational interviews
            </p>
          </div>

          {loading ? (
            <div className="text-base text-gray-600">Loading...</div>
          ) : !mockSummary || mockSummary.totalAttempts === 0 ? (
            <div className="space-y-6">
              <p className="text-base text-gray-700 font-medium">
                Build confidence with realistic interview simulations
              </p>
              <a
                href="/candidate/ai-mock-interview"
                className="inline-flex items-center justify-center rounded-xl px-6 py-4 text-base font-bold text-white shadow-md hover:shadow-lg transition"
                style={{
                  background: "linear-gradient(90deg, #4f46e5, #6366f1)",
                }}
              >
                Start Your First Test
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/60 rounded-lg p-4 border border-indigo-100">
                <div className="text-sm text-gray-600 font-medium">
                  Latest Score
                </div>
                <div className="text-4xl font-bold text-indigo-600 mt-2">
                  {mockSummary.latestScore || 0}
                  <span className="text-xl text-gray-600 font-semibold">
                    {" "}
                    / 100
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase">
                    Attempts
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {mockSummary.totalAttempts}
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase">
                    Avg Score
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {mockSummary.averageScore || 0}
                  </div>
                </div>
              </div>
              <a
                href="/candidate/ai-mock-interview"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-bold text-white hover:shadow-lg transition w-full"
                style={{
                  background: "linear-gradient(90deg, #4f46e5, #6366f1)",
                }}
              >
                Take Another Test
              </a>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-8 flex flex-col justify-between">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-base text-gray-600 mt-2">
              Jump to key features in seconds
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/candidate/job-profiles"
              className="flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 px-5 py-6 text-center transition hover:border-indigo-400"
            >
              <div>
                <div className="text-2xl mb-2">🔍</div>
                <div className="text-sm font-bold text-gray-900">
                  Browse Jobs
                </div>
              </div>
            </a>
            <a
              href="/candidate/resume-ats"
              className="flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 px-5 py-6 text-center transition hover:border-indigo-400"
            >
              <div>
                <div className="text-2xl mb-2">📄</div>
                <div className="text-sm font-bold text-gray-900">
                  Update Resume
                </div>
              </div>
            </a>
            <a
              href="/candidate/ai-mock-interview"
              className="flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 px-5 py-6 text-center transition hover:border-indigo-400"
            >
              <div>
                <div className="text-2xl mb-2">🎤</div>
                <div className="text-sm font-bold text-gray-900">
                  Mock Interview
                </div>
              </div>
            </a>
            <a
              href="/candidate/forum"
              className="flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 px-5 py-6 text-center transition hover:border-indigo-400"
            >
              <div>
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm font-bold text-gray-900">Forum</div>
              </div>
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
  <Layout role="CANDIDATE" active="dashboard">
    {page}
  </Layout>
);

export default CandidateDashboard;
