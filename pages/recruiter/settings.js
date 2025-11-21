// pages/recruiter/settings.js
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * SETTINGS (useful & fully local, no external libs)
 *
 * Persists to localStorage["recruiter.settings"]
 * Also lets you export/import all recruiter-side data:
 *  - recruiter.jobs
 *  - recruiter.jds
 *  - recruiter.candidates
 *  - recruiter.company
 *  - recruiter.settings
 */

const LS_SETTINGS_KEY = "recruiter.settings";

// sensible defaults
const DEFAULTS = {
  notifications: {
    newApplicants: true,
    interviewReminders: true,
    jdChanges: true,
    dailyDigest: false,
  },
  automation: {
    autoShortlistScore: 80, // candidates with >= score get suggested
    autoRejectScore: 40, // candidates with < score get suggested reject
  },
  comms: {
    emailFrom: "talent@company.com",
    interviewTemplate:
      "Hi {name},\n\nWe reviewed your profile for {role}. We'd like to invite you for a {round} round.\n\nDate/Time: {datetime}\nMode: {mode}\n\nBest,\n{recruiter}",
  },
  work: {
    timezone: "Asia/Kolkata",
    businessHours: { start: "10:00", end: "19:00" },
    week: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  ui: {
    density: "comfortable", // compact | comfortable | spacious
  },
};

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function Settings() {
  const [S, setS] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const importRef = useRef(null);

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setS({ ...DEFAULTS, ...parsed }); // shallow merge to keep new defaults
      }
    } catch {}
  }, []);

  const persist = (next) => {
    setS(next);
    try {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
  };

  // convenience setter
  const put = (path, value) => {
    const next = structuredClone(S);
    const parts = path.split(".");
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = value;
    persist(next);
  };

  // EXPORT / IMPORT -----------------------------------------

  const snapshotAll = () => {
    const get = (k, fallback = null) => {
      try {
        const raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    return {
      __exportedAt: new Date().toISOString(),
      jobs: get("recruiter.jobs", []),
      jds: get("recruiter.jds", []),
      candidates: get("recruiter.candidates", []),
      company: get("recruiter.company", null),
      settings: get("recruiter.settings", S),
    };
  };

  const exportAll = () => {
    const data = snapshotAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recruiter-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = async (file) => {
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);

      // basic shape validation
      if (typeof data !== "object") throw new Error("Invalid JSON structure");

      const putLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

      if ("jobs" in data) putLS("recruiter.jobs", data.jobs || []);
      if ("jds" in data) putLS("recruiter.jds", data.jds || []);
      if ("candidates" in data)
        putLS("recruiter.candidates", data.candidates || []);
      if ("company" in data) putLS("recruiter.company", data.company || {});
      if ("settings" in data) {
        putLS("recruiter.settings", data.settings || DEFAULTS);
        setS({ ...DEFAULTS, ...(data.settings || {}) }); // hydrate UI
      }

      alert("Data imported successfully.");
    } catch (e) {
      alert("Failed to import JSON. " + e.message);
    }
  };

  const resetAllRecruiterData = () => {
    if (
      !confirm(
        "This will clear recruiter jobs, candidates, JDs, company profile, and settings from this browser. Continue?"
      )
    )
      return;
    [
      "recruiter.jobs",
      "recruiter.candidates",
      "recruiter.jds",
      "recruiter.company",
      "recruiter.settings",
    ].forEach((k) => localStorage.removeItem(k));
    setS(DEFAULTS);
    alert("Cleared all recruiter data in localStorage.");
  };

  // RENDER ---------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        {saved && <span className="text-sm text-emerald-300">Saved</span>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="card">
            <h3 className="font-semibold mb-2">Notifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={S.notifications.newApplicants}
                  onChange={(e) =>
                    put("notifications.newApplicants", e.target.checked)
                  }
                />
                New applicant alerts
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={S.notifications.interviewReminders}
                  onChange={(e) =>
                    put("notifications.interviewReminders", e.target.checked)
                  }
                />
                Interview reminders
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={S.notifications.jdChanges}
                  onChange={(e) =>
                    put("notifications.jdChanges", e.target.checked)
                  }
                />
                JD changes & updates
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={S.notifications.dailyDigest}
                  onChange={(e) =>
                    put("notifications.dailyDigest", e.target.checked)
                  }
                />
                Daily email digest
              </label>
            </div>
          </div>

          {/* Automation thresholds */}
          <div className="card">
            <h3 className="font-semibold mb-2">Automation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm opacity-80">
                  Auto-shortlist threshold (score ≥)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input w-full mt-1"
                  value={S.automation.autoShortlistScore}
                  onChange={(e) =>
                    put(
                      "automation.autoShortlistScore",
                      Number(e.target.value || 0)
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm opacity-80">
                  Auto-reject threshold (score &lt;)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input w-full mt-1"
                  value={S.automation.autoRejectScore}
                  onChange={(e) =>
                    put(
                      "automation.autoRejectScore",
                      Number(e.target.value || 0)
                    )
                  }
                />
              </div>
            </div>
            <p className="text-xs opacity-70 mt-2">
              These thresholds are used by analytics/AI suggestions to
              recommend candidates for shortlisting or rejection (no automatic
              actions performed yet).
            </p>
          </div>

          {/* Communication */}
          <div className="card">
            <h3 className="font-semibold mb-2">Communication</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm opacity-80">Email From</label>
                <input
                  className="input w-full mt-1"
                  value={S.comms.emailFrom}
                  onChange={(e) => put("comms.emailFrom", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm opacity-80">Timezone</label>
                <select
                  className="input w-full mt-1"
                  value={S.work.timezone}
                  onChange={(e) => put("work.timezone", e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-sm opacity-80">
                  Business hours (start)
                </label>
                <input
                  type="time"
                  className="input w-full mt-1"
                  value={S.work.businessHours.start}
                  onChange={(e) =>
                    put("work.businessHours.start", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm opacity-80">
                  Business hours (end)
                </label>
                <input
                  type="time"
                  className="input w-full mt-1"
                  value={S.work.businessHours.end}
                  onChange={(e) =>
                    put("work.businessHours.end", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm opacity-80">
                Interview Email Template
              </label>
              <textarea
                className="textarea w-full mt-2 min-h-[160px]"
                value={S.comms.interviewTemplate}
                onChange={(e) =>
                  put("comms.interviewTemplate", e.target.value)
                }
              />
              <div className="text-xs opacity-70 mt-1">
                Variables:{" "}
                {"{name} {role} {round} {datetime} {mode} {recruiter}"}
              </div>
            </div>
          </div>

          {/* UI */}
          <div className="card">
            <h3 className="font-semibold mb-2">Interface</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {["compact", "comfortable", "spacious"].map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="density"
                    checked={S.ui.density === d}
                    onChange={() => put("ui.density", d)}
                  />
                  {d[0].toUpperCase() + d.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-2">Backup & Restore</h3>
            <p className="text-sm opacity-80">
              Export/Import all recruiter data stored in this browser. Useful
              for migration or backup.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn outline" onClick={exportAll}>
                Export JSON
              </button>
              <button
                className="btn ghost"
                onClick={() => importRef.current?.click()}
              >
                Import JSON
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => importAll(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Danger Zone</h3>
            <p className="text-sm opacity-80">
              Clears recruiter-side data from <i>localStorage</i> only for this
              browser.
            </p>
            <button className="btn ghost mt-3" onClick={resetAllRecruiterData}>
              Reset recruiter data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Settings.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="settings">
      {page}
    </DashboardLayout>
  );
};

export default Settings;
