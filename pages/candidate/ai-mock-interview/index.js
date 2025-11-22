// pages/candidate/ai-mock-interview/index.js
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function AIMockInterview() {
  const [attempts, setAttempts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const [sumRes, attRes] = await Promise.all([
          fetch("/api/mock-interview/summary"),
          fetch("/api/mock-interview/attempts"),
        ]);

        if (!alive) return;

        if (sumRes.ok) {
          const s = await sumRes.json();
          setSummary(s);
        } else {
          console.error("Summary fetch failed:", await sumRes.text());
        }

        if (attRes.ok) {
          const a = await attRes.json();
          setAttempts(a.attempts || []);
        } else {
          console.error("Attempts fetch failed:", await attRes.text());
        }
      } catch (err) {
        console.error("Load error:", err);
        if (!alive) return;
        setSummary(null);
        setAttempts([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const latest = summary?.latest;
  const metrics = latest?.details || {};
  const skills = summary?.skills || {};

  const handleTakeTest = () => {
    window.location.href = "/candidate/ai-mock-interview/live";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-lg text-gray-600 font-medium">Loading your mock interview data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">AI Mock Interviews</h1>
          <p className="text-lg text-gray-600 mt-3">
            Practice real interviews with AI. Get evaluated on appearance, language, confidence, delivery, and knowledge.
          </p>
        </div>
        <button
          onClick={handleTakeTest}
          className="px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:shadow-lg transition-all whitespace-nowrap"
        >
          🎤 Take a Test
        </button>
      </div>

      {/* Overall Score & How It Works */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-8">
          <div className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3">
            Overall Score
          </div>
          <div className="text-6xl font-bold text-indigo-900">
            {latest?.score ?? "--"}
            <span className="text-2xl font-semibold text-indigo-600 ml-2">/ 100</span>
          </div>
          <p className="text-sm text-indigo-700 mt-4">
            Based on your latest attempt
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 How It Works</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-base">
              <span className="text-indigo-600 font-bold flex-shrink-0">1.</span>
              <span className="text-gray-700">AI evaluates your video responses in real-time</span>
            </li>
            <li className="flex gap-3 text-base">
              <span className="text-indigo-600 font-bold flex-shrink-0">2.</span>
              <span className="text-gray-700">Scores 5 soft skills using ML models</span>
            </li>
            <li className="flex gap-3 text-base">
              <span className="text-indigo-600 font-bold flex-shrink-0">3.</span>
              <span className="text-gray-700">Improves with more attempts and practice</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Skill Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skill Breakdown</h2>
        <p className="text-base text-gray-600 mb-8">
          Average scores across all your attempts
        </p>

        <div className="space-y-6">
          {[
            { key: "appearance", label: "Appearance", icon: "👔" },
            { key: "language", label: "Language", icon: "💬" },
            { key: "confidence", label: "Confidence", icon: "💪" },
            { key: "contentDelivery", label: "Content Delivery", icon: "📢" },
            { key: "knowledge", label: "Knowledge", icon: "🧠" },
          ].map(({ key, label, icon }) => {
            const value = skills[key] ?? 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-lg font-semibold text-gray-900">{label}</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">{value} / 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    style={{
                      width: `${value}%`,
                      background: "linear-gradient(90deg, #4f46e5, #06b6d4)",
                      transition: "width 0.6s ease",
                    }}
                    className="h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Previous Attempts */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Previous Attempts</h2>

        {attempts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-lg text-gray-600 font-medium">No attempts yet</p>
            <p className="text-base text-gray-500 mt-2">Start your first mock interview to see results here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Overall</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">👔 Appearance</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">💬 Language</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">💪 Confidence</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">📢 Delivery</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">🧠 Knowledge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((a) => {
                  const d = a.takenAt ? new Date(a.takenAt) : null;
                  const details = a.details || {};
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {d ? d.toLocaleDateString() : "--"}
                      </td>
                      <td className="px-4 py-4 text-lg font-bold text-indigo-600">{a.score}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{details.appearance ?? "--"}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{details.language ?? "--"}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{details.confidence ?? "--"}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{details.contentDelivery ?? "--"}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{details.knowledge ?? "--"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

AIMockInterview.getLayout = (page) => (
  <Layout role="CANDIDATE" active="ai-mock">
    {page}
  </Layout>
);