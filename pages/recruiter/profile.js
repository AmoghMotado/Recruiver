// pages/recruiter/profile.js

import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const LS_KEY = "recruiter.company";

const DEFAULTS = {
  name: "Your Company Pvt. Ltd.",
  website: "https://www.example.com",
  location: "Remote / Global",
  size: "51–200",
  industry: "Software",
  about:
    "We build delightful products that solve real problems. Our culture values ownership, craftsmanship, and kindness.",
  hiringPreferences:
    "Fast-track candidates with OSS contributions and strong system design.",
  socials: {
    linkedin: "https://linkedin.com/company/your-company",
    twitter: "https://x.com/your-company",
  },
  logoDataUrl: "",
  defaultJDTemplate:
    "Role: <Job Title>\nLocation: <Onsite/Remote/Hybrid>\nExperience: <X–Y years>\nSkills: React, Node, SQL, Docker\nNice-to-have: GraphQL, AWS\nAbout the role: <brief>\nResponsibilities:\n- \n- \n- \nWhy join us:\n- Impact\n- Ownership\n- Learning",
};

export default function CompanyProfile() {
  const [data, setData] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const merged = { ...DEFAULTS, ...JSON.parse(raw) };
        setData(merged);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("recruiter-company-updated", {
              detail: { company: merged },
            })
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const broadcastCompany = (company) => {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("recruiter-company-updated", {
            detail: { company },
          })
        );
      }
    } catch {
      // ignore
    }
  };

  const save = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      broadcastCompany(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
  };

  const reset = () => {
    if (!confirm("Reset Company Profile to defaults?")) return;
    setData(DEFAULTS);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(DEFAULTS));
      broadcastCompany(DEFAULTS);
    } catch {
      // ignore
    }
  };

  const onLogoChange = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...data, logoDataUrl: reader.result };
      setData(next);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-12">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form (2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Logo & Identity Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-8">
              {/* Logo Upload */}
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-gray-200 overflow-hidden grid place-items-center shadow-sm">
                  {data.logoDataUrl ? (
                    <img
                      src={data.logoDataUrl}
                      alt="Company Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🏢</span>
                  )}
                </div>
                <button
                  className="w-full mt-4 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {data.logoDataUrl ? "Change" : "Upload Logo"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onLogoChange(e.target.files?.[0])}
                />
              </div>

              {/* Identity Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={data.name}
                    onChange={(e) =>
                      setData((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={data.website}
                    onChange={(e) =>
                      setData((d) => ({ ...d, website: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={data.location}
                    onChange={(e) =>
                      setData((d) => ({ ...d, location: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Size
                    </label>
                    <select
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={data.size}
                      onChange={(e) =>
                        setData((d) => ({ ...d, size: e.target.value }))
                      }
                    >
                      {[
                        "1–10",
                        "11–50",
                        "51–200",
                        "201–500",
                        "501–1000",
                        "1000+",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Industry
                    </label>
                    <input
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={data.industry}
                      onChange={(e) =>
                        setData((d) => ({ ...d, industry: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Company Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-gray-900">About Company</h3>
              <span className="text-xl">📝</span>
            </div>
            <textarea
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[140px] resize-none"
              value={data.about}
              onChange={(e) =>
                setData((d) => ({ ...d, about: e.target.value }))
              }
            />
          </div>

          {/* Hiring Preferences Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Hiring Preferences
              </h3>
              <span className="text-xl">🎯</span>
            </div>
            <textarea
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] resize-none"
              value={data.hiringPreferences}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  hiringPreferences: e.target.value,
                }))
              }
            />

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={data.socials.linkedin}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      socials: { ...d.socials, linkedin: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Twitter / X Profile
                </label>
                <input
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={data.socials.twitter}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      socials: { ...d.socials, twitter: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={save}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              Save Changes ✓
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset to Defaults
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <span>✓</span> Saved successfully!
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview (1 column) */}
        <div className="space-y-8">
          {/* Company Preview Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-8 sticky top-8">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-6">
              Preview
            </h3>

            <div className="bg-white rounded-lg p-6 border border-indigo-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 overflow-hidden grid place-items-center shrink-0 border border-indigo-200">
                  {data.logoDataUrl ? (
                    <img
                      src={data.logoDataUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">
                    {data.name}
                  </div>
                  <div className="text-xs font-semibold text-gray-500 mt-1">
                    {data.industry} • {data.size}
                  </div>
                  <a
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                    href={data.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    About
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {data.about}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Location
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {data.location}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <a
                    href={data.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={data.socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    X / Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      
    </div>
  );
}

CompanyProfile.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="company-profile">
      {page}
    </DashboardLayout>
  );
};