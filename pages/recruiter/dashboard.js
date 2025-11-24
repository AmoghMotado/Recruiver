// pages/recruiter/dashboard.js
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import JobPostingsTable from "@/components/recruiter/JobPostingsTable";
import CandidatesTable from "@/components/recruiter/CandidatesTable";
import RealTimeDataPanel from "@/components/recruiter/RealTimeDataPanel";
import CalendarWidget from "@/components/recruiter/CalendarWidget";
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  Calendar,
  Plus,
  ArrowRight
} from "lucide-react";

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
  
  // FIX 1: Initialize atsScores as an empty object. This prevents reading properties of undefined/null.
  const [atsScores, setAtsScores] = useState({}); 

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/jobs/my", {
        credentials: "include",
      });
      
      if (!res.ok) {
        console.warn("Jobs API returned:", res.status);
        setJobs([]);
        return;
      }

      const data = await res.json().catch(() => ({ jobs: [] }));
      const mapped = (data.jobs || []).map(mapServerJobToTable);
      setJobs(mapped);
    } catch (e) {
      console.error("Error loading jobs:", e);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplicants = async () => {
    setLoadingApplicants(true);
    try {
      // ✅ USE SAME ENDPOINT AS CANDIDATES PAGE
      const res = await fetch("/api/jobs/recruiter-candidates", {
        credentials: "include",
      });
      
      if (!res.ok) {
        console.warn("Applicants API returned:", res.status);
        setApplicants([]);
        return;
      }

      const data = await res.json().catch(() => ({ candidates: [] }));
      
      // ✅ TRANSFORM candidates → applicants format
      const applicants = (data.candidates || []).map((c) => ({
        id: c.applicationId || c.id,
        applicationId: c.applicationId || c.id,
        name: c.name || "Unknown",
        email: c.email || "",
        jobTitle: c.jobTitle || "",
        company: c.company || "",
        status: c.status || "APPLIED",
        score: c.score || 0,
        aptitudeScore: c.aptitudeScore || null,
        videoInterviewScore: c.videoInterviewScore || null,
        appliedDate: c.appliedDate || c.createdAt,
        resumePath: c.resumePath || null,
        stage: c.stage || 0,
      }));
      
      setApplicants(applicants);
      
      // NOTE: In a real app, you would fetch and populate setAtsScores({}) here, 
      // keyed by application ID or email.
      
    } catch (e) {
      console.error("Error loading applicants:", e);
      setApplicants([]);
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
      applicants.filter((a) => a.status === "SHORTLISTED").length || 0,
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
    if (!candidate.resumePath) {
      alert("No resume uploaded for this candidate.");
      return;
    }
    window.open(candidate.resumePath, "_blank");
  };

  const handleChangeStatus = (id, newStatus) => {
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
    <div className="space-y-8 pb-12 pt-6">
      
      {/* KPI Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Applicants" 
          value={loadingApplicants ? "--" : totals.applicants}
          sub="Candidates applied"
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          color="border-l-4 border-indigo-500"
          href="/recruiter/candidates"
        />
        <KPICard 
          title="Active Jobs" 
          value={loadingJobs ? "--" : totals.jobs}
          sub="Open positions"
          icon={<Briefcase className="w-6 h-6 text-blue-600" />}
          color="border-l-4 border-blue-500"
          href="/recruiter/jobs"
        />
        <KPICard 
          title="Shortlisted" 
          value={loadingApplicants ? "--" : totals.shortlisted}
          sub="Ready for interview"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          color="border-l-4 border-emerald-500"
          href="/recruiter/candidates"
        />
        <KPICard 
          title="Upcoming Events" 
          value={totals.events}
          sub="Scheduled meetings"
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          color="border-l-4 border-purple-500"
          href="/recruiter/calendar"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Candidates Table Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Candidates</h2>
                <p className="text-sm text-gray-500 mt-1">Review and manage new applications</p>
              </div>
              <a 
                href="/recruiter/candidates" 
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </a>
            </div>

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
              // Pass the initialized atsScores object
              atsScores={atsScores} 
            />
          </div>

          {/* Job Postings Table Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Active Job Postings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your open roles</p>
              </div>
              <button
                onClick={() => (location.href = "/recruiter/jobs")}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" /> Post New Job
              </button>
            </div>

            <JobPostingsTable
              jobs={jobs}
              loading={loadingJobs}
              onAddJob={() => (location.href = "/recruiter/jobs")}
              onEditJob={() => (location.href = "/recruiter/jobs")}
              onDeleteJob={() => (location.href = "/recruiter/jobs")}
            />
          </div>

        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div className="space-y-8">
          
          {/* Real-Time Activity Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
              Live Activity
            </h2>
            <RealTimeDataPanel 
              applicants={applicants}
              jobs={jobs}
              loading={loadingApplicants || loadingJobs}
            />
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Schedule</h2>
            <CalendarWidget />
          </div>
          
        </div>
      </div>
    </div>
  );
}

// Helper Component for KPI Cards
function KPICard({ title, value, sub, icon, color, href }) {
  return (
    <a 
      href={href} 
      className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group ${color}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-4xl font-extrabold text-gray-900 tracking-tight">{value}</div>
        <div className="font-bold text-gray-700 mt-1">{title}</div>
        <div className="text-sm text-gray-400 mt-1 font-medium">{sub}</div>
      </div>
    </a>
  );
}

RecruiterDashboard.getLayout = (page) => (
  <DashboardLayout role="RECRUITER" active="dashboard">
    {page}
  </DashboardLayout>
);

export default RecruiterDashboard;