// pages/recruiter/settings.js
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const LS_SETTINGS_KEY = "recruiter.settings";

const DEFAULTS = {
  notifications: {
    newApplicants: true,
    interviewReminders: true,
    jdChanges: true,
    dailyDigest: false,
  },
  automation: {
    autoShortlistScore: 80,
    autoRejectScore: 40,
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
    density: "comfortable",
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setS({ ...DEFAULTS, ...parsed });
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

  const put = (path, value) => {
    const next = structuredClone(S);
    const parts = path.split(".");
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = value;
    persist(next);
  };

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

      if (typeof data !== "object") throw new Error("Invalid JSON structure");

      const putLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

      if ("jobs" in data) putLS("recruiter.jobs", data.jobs || []);
      if ("jds" in data) putLS("recruiter.jds", data.jds || []);
      if ("candidates" in data)
        putLS("recruiter.candidates", data.candidates || []);
      if ("company" in data) putLS("recruiter.company", data.company || {});
      if ("settings" in data) {
        putLS("recruiter.settings", data.settings || DEFAULTS);
        setS({ ...DEFAULTS, ...(data.settings || {}) });
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

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings ⚙️</h1>
          <p className="text-lg text-gray-600">
            Configure notifications, automation, and system preferences
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <span>✓</span> Saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Notifications Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <span className="text-xl">🔔</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={S.notifications.newApplicants}
                  onChange={(e) =>
                    put("notifications.newApplicants", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    New Applicant Alerts
                  </div>
                  <div className="text-sm text-gray-600">
                    Get notified when candidates apply
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={S.notifications.interviewReminders}
                  onChange={(e) =>
                    put("notifications.interviewReminders", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    Interview Reminders
                  </div>
                  <div className="text-sm text-gray-600">
                    Reminders before scheduled interviews
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={S.notifications.jdChanges}
                  onChange={(e) =>
                    put("notifications.jdChanges", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    JD Changes & Updates
                  </div>
                  <div className="text-sm text-gray-600">
                    Notify when job descriptions change
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={S.notifications.dailyDigest}
                  onChange={(e) =>
                    put("notifications.dailyDigest", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    Daily Email Digest
                  </div>
                  <div className="text-sm text-gray-600">
                    Receive daily summary email
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Automation Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Automation</h3>
              <span className="text-xl">🤖</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Auto-shortlist Threshold
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={S.automation.autoShortlistScore}
                    onChange={(e) =>
                      put(
                        "automation.autoShortlistScore",
                        Number(e.target.value || 0)
                      )
                    }
                  />
                  <span className="absolute right-4 top-3 text-sm font-semibold text-gray-600">
                    Score ≥
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Candidates with this score or higher will be auto-suggested for shortlisting
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Auto-reject Threshold
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={S.automation.autoRejectScore}
                    onChange={(e) =>
                      put(
                        "automation.autoRejectScore",
                        Number(e.target.value || 0)
                      )
                    }
                  />
                  <span className="absolute right-4 top-3 text-sm font-semibold text-gray-600">
                    Score &lt;
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Candidates below this score will be suggested for rejection
                </p>
              </div>
            </div>
          </div>

          {/* Communication Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Communication</h3>
              <span className="text-xl">📧</span>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email From
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={S.comms.emailFrom}
                    onChange={(e) => put("comms.emailFrom", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={S.work.timezone}
                    onChange={(e) => put("work.timezone", e.target.value)}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Hours (Start)
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={S.work.businessHours.start}
                    onChange={(e) =>
                      put("work.businessHours.start", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Hours (End)
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={S.work.businessHours.end}
                    onChange={(e) =>
                      put("work.businessHours.end", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Interview Email Template
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[140px] resize-none font-mono text-sm"
                  value={S.comms.interviewTemplate}
                  onChange={(e) =>
                    put("comms.interviewTemplate", e.target.value)
                  }
                />
                <div className="text-xs text-gray-600 mt-2">
                  <strong>Available variables:</strong> {"{name}"} {"{role}"}{" "}
                  {"{round}"} {"{datetime}"} {"{mode}"} {"{recruiter}"}
                </div>
              </div>
            </div>
          </div>

          {/* Interface Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Interface</h3>
              <span className="text-xl">🎨</span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                UI Density
              </label>
              <div className="flex gap-4">
                {["compact", "comfortable", "spacious"].map((d) => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="density"
                      checked={S.ui.density === d}
                      onChange={() => put("ui.density", d)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="font-medium text-gray-700">
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 col) */}
        <div className="space-y-8">
          {/* Backup & Restore */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Backup & Restore</h3>
              <span className="text-xl">💾</span>
            </div>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              Export all your recruiter data as JSON for backup or migration between browsers.
            </p>
            <div className="space-y-3">
              <button
                onClick={exportAll}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                📥 Export Backup
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-indigo-300 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                📤 Import Backup
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

          {/* Danger Zone */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
              <span className="text-xl">⚠️</span>
            </div>
            <p className="text-sm text-red-700 mb-6 leading-relaxed">
              Permanently clear all recruiter data from this browser's localStorage.
            </p>
            <button
              onClick={resetAllRecruiterData}
              className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Reset All Data
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