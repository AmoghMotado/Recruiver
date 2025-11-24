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

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      {/* SECURITY */}
      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Security</h2>
        <div className="grid grid-cols-3 gap-4">
          <input placeholder="Current Password" type="password" className="input" />
          <input placeholder="New Password" type="password" className="input" />
          <input placeholder="Confirm Password" type="password" className="input" />
        </div>
        <div className="flex gap-4 mt-4">
          <button className="btn primary">Update Password</button>
          <button className="btn secondary">Logout from all devices</button>
        </div>
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

      {/* DANGER ZONE */}
      <section className="card p-4 space-y-3">
        <button className="btn danger">Delete My Account</button>
      </section>
    </div>
  );
}

CandidateSettings.getLayout = (page) => (
  <Layout role="CANDIDATE" active="settings">{page}</Layout>
);