// ============================================
// FILE 1: pages/recruiter/calendar.js
// ============================================
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

function RecruiterCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1));
  const [events, setEvents] = useState([
    { date: 4, title: "Interview", type: "interview", color: "blue" },
    { date: 11, title: "Offer Call", type: "offer", color: "emerald" },
    { date: 20, title: "Hiring Sync", type: "sync", color: "amber" },
  ]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDay = (day) => {
    return events.filter((e) => e.date === day);
  };

  const getEventColor = (type) => {
    switch (type) {
      case "interview":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "offer":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "sync":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getEventEmoji = (type) => {
    switch (type) {
      case "interview":
        return "📋";
      case "offer":
        return "📞";
      case "sync":
        return "🔄";
      default:
        return "📌";
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Card (2 cols) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
                <p className="text-sm text-gray-600 mt-1">Interview scheduling calendar</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Previous month"
                >
                  <span className="text-lg">←</span>
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Next month"
                >
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-bold text-gray-600 uppercase tracking-widest py-3"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg border-2 p-2 transition-all ${
                      day
                        ? "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer"
                        : "border-transparent"
                    }`}
                  >
                    {day && (
                      <div className="h-full flex flex-col">
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          {day}
                        </div>
                        <div className="flex-1 space-y-1 overflow-y-auto">
                          {dayEvents.map((event, i) => (
                            <div
                              key={i}
                              className={`text-xs font-semibold px-2 py-1 rounded border ${getEventColor(
                                event.type
                              )}`}
                            >
                              <span>{getEventEmoji(event.type)}</span>
                              <span className="ml-1 truncate">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="text-sm font-bold text-gray-700 mb-4">Event Types</div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span className="text-sm font-semibold text-gray-700">Interviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  <span className="text-sm font-semibold text-gray-700">Offer Calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-semibold text-gray-700">Syncs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Info Cards */}
        <div className="space-y-6">
          {/* How It Works */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xl">ℹ️</span>
              <h3 className="text-sm font-bold text-gray-900">How This Works</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              This is a UI demo showing interview scheduling. In production, events sync from your ATS or Google Calendar, and you can click dates to view candidate details.
            </p>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📌</span> Upcoming Events
            </h3>
            <div className="space-y-3">
              {events.length > 0 ? (
                events.map((event, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${getEventColor(
                      event.type
                    )} text-xs font-semibold`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{getEventEmoji(event.type)}</span>
                      <div className="flex-1">
                        <div>{event.title}</div>
                        <div className="font-normal opacity-75">
                          {monthName.split(" ")[0]} {event.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-600">No events scheduled</p>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🚀</span> Next Steps
            </h3>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Sync interview rounds per job posting</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Send automatic reminders to candidates</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Block slots based on working hours</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Attach Zoom/Teams links to events</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

RecruiterCalendarPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="calendar">
      {page}
    </DashboardLayout>
  );
};

export default RecruiterCalendarPage;