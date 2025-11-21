import Layout from "@/components/Layout";
import { useState } from "react";

export default function CandidateSettings() {
  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    applicationUpdates: true,
    interviewReminders: true,
    atsAlerts: false,
    email: true,
  });

  const [preferences, setPreferences] = useState({
    role: "",
    location: "",
    experience: "",
  });

  const [resumeVisibility, setResumeVisibility] = useState("recruiters");
  const [theme, setTheme] = useState("dark");

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* SECURITY */}
      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Security</h2>
        <div className="grid grid-cols-3 gap-4">
          <input placeholder="Current Password" type="password" className="input" />
          <input placeholder="New Password" type="password" className="input" />
          <input placeholder="Confirm Password" type="password" className="input" />
        </div>
        <button className="btn primary mt-2">Update Password</button>
        <button className="btn secondary mt-2">Logout from all devices</button>
      </section>

      {/* NOTIFICATIONS */}
      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        {Object.entries(notifications).map(([key, value]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={() => toggleNotification(key)}
            />
            {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
          </label>
        ))}
      </section>

      {/* JOB PREFERENCES */}
      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Job Preferences</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            placeholder="Preferred Role (e.g. Data Analyst)"
            className="input"
            value={preferences.role}
            onChange={(e) => setPreferences({ ...preferences, role: e.target.value })}
          />
          <input
            placeholder="Preferred Location"
            className="input"
            value={preferences.location}
            onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
          />
          <input
            placeholder="Experience Level"
            className="input"
            value={preferences.experience}
            onChange={(e) => setPreferences({ ...preferences, experience: e.target.value })}
          />
        </div>
      </section>

      {/* RESUME SETTINGS */}
      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Resume & Privacy</h2>
        <label className="block mb-2 font-medium">Resume Visibility:</label>
        <select
          value={resumeVisibility}
          onChange={(e) => setResumeVisibility(e.target.value)}
          className="input"
        >
          <option value="public">Public</option>
          <option value="recruiters">Recruiters Only</option>
          <option value="private">Private</option>
        </select>
        <button className="btn secondary mt-2">Upload / Update Resume</button>
      </section>

      {/* THEME */}
      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Theme & Language</h2>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="input"
        >
          <option value="dark">Dark Mode</option>
          <option value="light">Light Mode</option>
        </select>
      </section>

      {/* DANGER ZONE */}
      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-sm text-red-300">
          Deleting your account will remove all your data, applications, and profile permanently.
        </p>
        <button className="btn danger mt-2">Delete My Account</button>
      </section>
    </div>
  );
}

CandidateSettings.getLayout = (page) => (
  <Layout role="CANDIDATE" active="settings">{page}</Layout>
);
