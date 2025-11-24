// pages/candidate/dashboard.js
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { 
  Briefcase, 
  FileText, 
  ArrowRight, 
  Zap, 
  MessageSquare, 
  Search,
  TrendingUp,
  Target
} from "lucide-react";

function Skeleton({ height = 120 }) {
  return (
    <div
      className="rounded-2xl bg-white/50 border border-white/60"
      style={{
        height,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.4s ease infinite",
      }}
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
  const mockAttempts = mockSummary?.totalAttempts || 0;

  return (
    <div className="pb-12 space-y-8">
      
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-indigo-200 text-lg opacity-90 max-w-xl">
            Track your applications, optimize your resume, and prepare for interviews all in one place.
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="ATS Score" 
          value={`${atsScore}%`} 
          desc="Resume Strength" 
          icon={<FileText className="w-6 h-6 text-white"/>} 
          color="bg-blue-500" 
          href="/candidate/resume-ats"
        />
        <MetricCard 
          label="Applications" 
          value={applications.length} 
          desc="Active Processes" 
          icon={<Briefcase className="w-6 h-6 text-white"/>} 
          color="bg-purple-500" 
          href="/candidate/job-profiles"
        />
        <MetricCard 
          label="Mock Tests" 
          value={mockAttempts} 
          desc="Interviews Taken" 
          icon={<MessageSquare className="w-6 h-6 text-white"/>} 
          color="bg-pink-500" 
          href="/candidate/ai-mock-interview"
        />
        <MetricCard 
          label="Profile" 
          value="85%" 
          desc="Completeness" 
          icon={<Target className="w-6 h-6 text-white"/>} 
          color="bg-orange-500" 
          href="/candidate/profile"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recommended Jobs */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                  Recommended For You
                </h2>
                <p className="text-sm text-gray-500 mt-1">Based on your skills and preferences</p>
              </div>
              <a href="/candidate/job-profiles" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map((k) => <Skeleton key={k} height={80} />)
              ) : recommendedJobs.length === 0 ? (
                <EmptyState message="No new recommendations right now." />
              ) : (
                recommendedJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-500 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm transition-all">
                        {job.company?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{job.title}</h3>
                        <p className="text-sm text-gray-500">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        {job.location || "Remote"}
                      </span>
                      <button className="p-2 rounded-full text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Recent Applications
              </h2>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <Skeleton height={60} />
              ) : applications.length === 0 ? (
                <EmptyState message="You haven't applied to any jobs yet." />
              ) : (
                applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-900">{app.job?.title || "Unknown Role"}</div>
                      <div className="text-sm text-gray-500">{app.job?.company} • Applied {new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      Applied
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <QuickAction icon={<Search className="w-5 h-5"/>} label="Find Jobs" desc="Browse openings" href="/candidate/job-profiles"/>
              <QuickAction icon={<FileText className="w-5 h-5"/>} label="Analyze Resume" desc="Check ATS Score" href="/candidate/resume-ats"/>
              <QuickAction icon={<Zap className="w-5 h-5"/>} label="Mock Interview" desc="Practice AI Test" href="/candidate/ai-mock-interview"/>
            </div>
          </div>

          {/* Mock Interview Promo */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white text-center shadow-lg">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to Practice?</h3>
              <p className="text-indigo-100 text-sm mb-6">
                Take a 5-minute AI mock interview to boost your confidence.
              </p>
              <a
                href="/candidate/ai-mock-interview"
                className="inline-block w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
              >
                Start Interview
              </a>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer { 0% { background-position: 0% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

/* --- Sub-components --- */

function MetricCard({ label, value, desc, icon, color, href }) {
  return (
    <a href={href} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-colors"/>
      </div>
      <div>
        <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
        <div className="font-bold text-gray-700 text-sm">{label}</div>
        <div className="text-xs text-gray-400 mt-1 font-medium">{desc}</div>
      </div>
    </a>
  );
}

function QuickAction({ icon, label, desc, href }) {
  return (
    <a href={href} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm group-hover:text-indigo-600 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="font-bold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-indigo-400 transition-colors" />
    </a>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
      <p className="text-gray-500 font-medium text-sm">{message}</p>
    </div>
  );
}

CandidateDashboard.getLayout = (page) => (
  <Layout role="CANDIDATE" active="dashboard">
    {page}
  </Layout>
);

export default CandidateDashboard;