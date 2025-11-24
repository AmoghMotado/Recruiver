// ============================================
// FILE: pages/recruiter/analytics.js
// ============================================
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SearchFilters from "@/components/analytics/SearchFilters";
import MetricsCards from "@/components/analytics/MetricsCards";
import SkillsDistributionChart from "@/components/analytics/SkillsDistributionChart";
import ExperienceChart from "@/components/analytics/ExperienceChart";
import GrowthTimelineChart from "@/components/analytics/GrowthTimelineChart";
import CandidateDataTable from "@/components/analytics/CandidateDataTable";
import ProfileCompletenessChart from "@/components/analytics/ProfileCompletenessChart";

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    skills: [],
    experienceLevel: "All",
    minExperience: 0,
    maxExperience: 20,
    education: "All",
    minProfileCompletion: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/analytics/candidates");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load analytics data");
        }

        setCandidates(data.candidates || []);
      } catch (err) {
        console.error("Analytics load error:", err);
        setError(err.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          candidate.name?.toLowerCase().includes(searchLower) ||
          candidate.email?.toLowerCase().includes(searchLower) ||
          candidate.headline?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.skills.length > 0) {
        const hasAllSkills = filters.skills.every((skill) =>
          (candidate.skills || []).some(
            (s) => s.toLowerCase() === skill.toLowerCase()
          )
        );
        if (!hasAllSkills) return false;
      }

      if (filters.experienceLevel !== "All") {
        const yearsExp = candidate.experienceYears || 0;
        if (filters.experienceLevel === "Entry" && yearsExp > 2) return false;
        if (
          filters.experienceLevel === "Junior" &&
          (yearsExp < 2 || yearsExp > 5)
        )
          return false;
        if (
          filters.experienceLevel === "Mid" &&
          (yearsExp < 5 || yearsExp > 8)
        )
          return false;
        if (
          filters.experienceLevel === "Senior" &&
          (yearsExp < 8 || yearsExp > 12)
        )
          return false;
        if (filters.experienceLevel === "Lead" && yearsExp < 12) return false;
      }

      const yearsExp = candidate.experienceYears || 0;
      if (
        yearsExp < filters.minExperience ||
        yearsExp > filters.maxExperience
      ) {
        return false;
      }

      if (filters.education !== "All") {
        const hasMatchingEducation = (candidate.education || []).some(
          (edu) =>
            edu.degree?.toLowerCase().includes(filters.education.toLowerCase())
        );
        if (!hasMatchingEducation) return false;
      }

      if (candidate.profileCompletion < filters.minProfileCompletion) {
        return false;
      }

      return true;
    });
  }, [candidates, filters]);

  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      alert("No candidates to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Headline",
      "Skills",
      "Experience (Years)",
      "Education",
      "Profile Completion %",
    ];

    const rows = filteredCandidates.map((c) => [
      c.name || "",
      c.email || "",
      c.phone || "",
      c.headline || "",
      (c.skills || []).join("; "),
      c.experienceYears || 0,
      (c.education || []).map((e) => e.degree).join("; "),
      c.profileCompletion || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `candidates_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-xl font-bold text-gray-900">
            Loading Analytics...
          </div>
          <div className="text-gray-600 mt-2">
            Fetching candidate data from Firestore
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Top Metrics */}
      <MetricsCards
        totalCandidates={candidates.length}
        filteredCount={filteredCandidates.length}
        candidates={candidates}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1">
          <SearchFilters
            filters={filters}
            setFilters={setFilters}
            candidates={candidates}
            filteredCount={filteredCandidates.length}
          />
        </div>

        {/* Right Content - Charts and Table */}
        <div className="lg:col-span-3 space-y-6">
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkillsDistributionChart candidates={filteredCandidates} />
            <ExperienceChart candidates={filteredCandidates} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfileCompletenessChart candidates={filteredCandidates} />
            <GrowthTimelineChart candidates={candidates} />
          </div>

          {/* Candidate Data Table */}
          <CandidateDataTable
            candidates={filteredCandidates}
            onExport={handleExportCSV}
          />
        </div>
      </div>

      {/* Footer / Actions - Export Button Moved Here */}
      <div className="flex justify-end pt-4 border-t border-gray-200 mt-8">
        <button
          onClick={handleExportCSV}
          className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:shadow-lg transition flex items-center gap-2"
          disabled={filteredCandidates.length === 0}
        >
          <span>📥</span> 
          Export CSV ({filteredCandidates.length})
        </button>
      </div>

    </div>
  );
}

Analytics.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="analytics">
      {page}
    </DashboardLayout>
  );
};

export default Analytics;