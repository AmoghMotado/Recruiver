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
  logoDataUrl: "", // base64 image
  defaultJDTemplate:
    "Role: <Job Title>\nLocation: <Onsite/Remote/Hybrid>\nExperience: <X–Y years>\nSkills: React, Node, SQL, Docker\nNice-to-have: GraphQL, AWS\nAbout the role: <brief>\nResponsibilities:\n- \n- \n- \nWhy join us:\n- Impact\n- Ownership\n- Learning",
};

export default function CompanyProfile() {
  const [data, setData] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setData({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  // helpers
  const save = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
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
    } catch {
      // ignore
    }
  };

  const onLogoChange = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setData((d) => ({ ...d, logoDataUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Company Profile</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Identity */}
          <div className="card">
            <div className="flex items-start gap-5">
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-xl bg-white/10 overflow-hidden grid place-items-center">
                  {data.logoDataUrl ? (
                    <img
                      src={data.logoDataUrl}
                      alt="Company Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg opacity-70">🏢</span>
                  )}
                </div>
                <button
                  className="btn outline w-full mt-2"
                  onClick={() => fileRef.current?.click()}
                >
                  {data.logoDataUrl ? "Change Logo" : "Upload Logo"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onLogoChange(e.target.files?.[0])}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="text-sm opacity-80">Company Name</label>
                  <input
                    className="input w-full mt-1"
                    value={data.name}
                    onChange={(e) =>
                      setData((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm opacity-80">Website</label>
                  <input
                    className="input w-full mt-1"
                    value={data.website}
                    onChange={(e) =>
                      setData((d) => ({ ...d, website: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm opacity-80">Location</label>
                  <input
                    className="input w-full mt-1"
                    value={data.location}
                    onChange={(e) =>
                      setData((d) => ({ ...d, location: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm opacity-80">Company Size</label>
                    <select
                      className="input w-full mt-1"
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
                    <label className="text-sm opacity-80">Industry</label>
                    <input
                      className="input w-full mt-1"
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

          {/* About */}
          <div className="card">
            <label className="text-sm opacity-80">About Company</label>
            <textarea
              className="textarea w-full mt-2 min-h-[140px]"
              value={data.about}
              onChange={(e) =>
                setData((d) => ({ ...d, about: e.target.value }))
              }
            />
          </div>

          {/* Hiring Preferences */}
          <div className="card">
            <label className="text-sm opacity-80">
              Hiring Preferences / Notes
            </label>
            <textarea
              className="textarea w-full mt-2 min-h-[100px]"
              value={data.hiringPreferences}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  hiringPreferences: e.target.value,
                }))
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-sm opacity-80">LinkedIn</label>
                <input
                  className="input w-full mt-1"
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
                <label className="text-sm opacity-80">Twitter/X</label>
                <input
                  className="input w-full mt-1"
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

          {/* Default JD Template */}
          <div className="card">
            <div className="flex items-center justify-between">
              <label className="text-sm opacity-80">Default JD Template</label>
              <button
                className="btn ghost"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    defaultJDTemplate: DEFAULTS.defaultJDTemplate,
                  }))
                }
              >
                Reset Template
              </button>
            </div>
            <textarea
              className="textarea w-full mt-2 min-h-[220px]"
              value={data.defaultJDTemplate}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  defaultJDTemplate: e.target.value,
                }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="btn primary" onClick={save}>
              Save Changes
            </button>
            <button className="btn outline" onClick={reset}>
              Reset to Defaults
            </button>
            {saved && (
              <span className="text-sm text-emerald-300">Saved!</span>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden grid place-items-center shrink-0">
                {data.logoDataUrl ? (
                  <img
                    src={data.logoDataUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>🏢</span>
                )}
              </div>
              <div>
                <div className="font-semibold">{data.name}</div>
                <div className="text-xs opacity-70">
                  {data.industry} • {data.size}
                </div>
                <a
                  className="text-xs text-sky-300 hover:underline"
                  href={data.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.website}
                </a>
              </div>
            </div>
            <div className="mt-4 text-sm whitespace-pre-wrap opacity-90">
              {data.about}
            </div>
            <div className="mt-3 text-xs opacity-70">
              {data.location} •{" "}
              <a
                className="hover:underline"
                href={data.socials.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>{" "}
              •{" "}
              <a
                className="hover:underline"
                href={data.socials.twitter}
                target="_blank"
                rel="noreferrer"
              >
                X
              </a>
            </div>
          </div>

          <div className="card">
            <div className="font-semibold mb-2">JD Template Preview</div>
            <pre className="whitespace-pre-wrap text-sm opacity-90">
              {data.defaultJDTemplate}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ✅ Use the new unified dashboard layout with sticky sidebar + chat */
CompanyProfile.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="company-profile">
      {page}
    </DashboardLayout>
  );
};
