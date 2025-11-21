export default function CalendarWidget() {
  // simple placeholder month grid
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const events = { 5: "Interview", 12: "Offer Call", 21: "Hiring Sync" };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Calendar — {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</div>
        <div className="text-xs opacity-70">Demo</div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d) => (
          <div key={d} className="rounded-md px-2 py-3 bg-white/5">
            <div className="text-sm">{d}</div>
            {events[d] && <div className="mt-1 text-[11px] bg-sky-600/30 px-1 py-0.5 rounded">{events[d]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
