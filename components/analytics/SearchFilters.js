// components/analytics/SearchFilters.js
import { useMemo } from "react";

export default function SearchFilters({
  filters,
  setFilters,
  candidates,
  filteredCount,
}) {
  // Extract all unique skills from candidates
  const allSkills = useMemo(() => {
    const skillSet = new Set();
    candidates.forEach((c) => {
      (c.skills || []).forEach((skill) => {
        skillSet.add(skill);
      });
    });
    return Array.from(skillSet).sort();
  }, [candidates]);

  // Top 15 most common skills
  const topSkills = useMemo(() => {
    const skillCounts = {};
    candidates.forEach((c) => {
      (c.skills || []).forEach((skill) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    return Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill]) => skill);
  }, [candidates]);

  const toggleSkill = (skill) => {
    setFilters((prev) => {
      const hasSkill = prev.skills.includes(skill);
      return {
        ...prev,
        skills: hasSkill
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      skills: [],
      experienceLevel: "All",
      minExperience: 0,
      maxExperience: 20,
      education: "All",
      minProfileCompletion: 0,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.skills.length > 0 ||
    filters.experienceLevel !== "All" ||
    filters.minExperience > 0 ||
    filters.maxExperience < 20 ||
    filters.education !== "All" ||
    filters.minProfileCompletion > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">🔍 Search & Filter</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="text-2xl font-bold text-indigo-900">
          {filteredCount}
        </div>
        <div className="text-sm text-indigo-700">
          {filteredCount === 1 ? "Candidate" : "Candidates"} Found
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          placeholder="Name, email, headline..."
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Skills Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Skills {filters.skills.length > 0 && `(${filters.skills.length})`}
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {topSkills.map((skill) => {
            const isSelected = filters.skills.includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
        {filters.skills.length > 0 && (
          <div className="text-xs text-gray-600 mb-2">Selected:</div>
        )}
        {filters.skills.map((skill) => (
          <div
            key={skill}
            className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-lg mb-2"
          >
            <span className="text-sm font-medium text-indigo-900">{skill}</span>
            <button
              onClick={() => toggleSkill(skill)}
              className="text-indigo-600 hover:text-indigo-800 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Experience Level */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Experience Level
        </label>
        <select
          value={filters.experienceLevel}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              experienceLevel: e.target.value,
            }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Levels</option>
          <option value="Entry">Entry (0-2 years)</option>
          <option value="Junior">Junior (2-5 years)</option>
          <option value="Mid">Mid (5-8 years)</option>
          <option value="Senior">Senior (8-12 years)</option>
          <option value="Lead">Lead (12+ years)</option>
        </select>
      </div>

      {/* Experience Range */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Years of Experience: {filters.minExperience} - {filters.maxExperience}
        </label>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Min:</label>
            <input
              type="range"
              min="0"
              max="20"
              value={filters.minExperience}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minExperience: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Max:</label>
            <input
              type="range"
              min="0"
              max="20"
              value={filters.maxExperience}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxExperience: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Education Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Education
        </label>
        <select
          value={filters.education}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, education: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Education</option>
          <option value="Bachelor">Bachelor's</option>
          <option value="Master">Master's</option>
          <option value="PhD">PhD</option>
          <option value="Diploma">Diploma</option>
        </select>
      </div>

      {/* Profile Completion Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Min Profile Completion: {filters.minProfileCompletion}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={filters.minProfileCompletion}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              minProfileCompletion: parseInt(e.target.value),
            }))
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}