// pages/recruiter/calendar.js

import DashboardLayout from "@/components/DashboardLayout";
import CalendarWidget from "@/components/recruiter/CalendarWidget";

function RecruiterCalendarPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Calendar &amp; Scheduling
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track interviews, offer calls and hiring events on a single view.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
          Demo
        </span>
      </header>

      {/* Main calendar widget (same component as dashboard sidebar) */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="card">
          <CalendarWidget />
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold mb-1">How this works</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              This is a UI-only demo calendar. In a full integration, interview
              slots and events would be synced from your ATS or calendar system
              (Google / Outlook), and clicking on a date would show the list of
              candidates scheduled on that day.
            </p>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold mb-1">Ideas for next steps</h2>
            <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1.5">
              <li>Sync interview rounds for each job posting.</li>
              <li>Send automatic reminders to candidates and panelists.</li>
              <li>Block slots based on recruiter working hours.</li>
              <li>Attach meeting links directly to each event.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

// Attach unified dashboard layout (recruiter role, "Calendar" active in sidebar)
RecruiterCalendarPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="calendar">
      {page}
    </DashboardLayout>
  );
};

export default RecruiterCalendarPage;
