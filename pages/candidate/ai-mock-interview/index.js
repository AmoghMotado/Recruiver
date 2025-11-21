// pages/candidate/ai-mock-interview/index.js - FIXED
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
    // Redirect to live interview page
    window.location.href = "/candidate/ai-mock-interview/live";
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        Loading your mock interview data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header area */}
      <div className="card" style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>AI Mock Interview</h2>
            <p style={{ color: "var(--muted)" }}>
              Practice real interviews with AI — evaluate appearance, language,
              confidence, content delivery, and knowledge.
            </p>
          </div>

          <button className="btn primary" onClick={handleTakeTest}>
            Take a Test
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
          }}
        >
          {/* Left card: Overall score */}
          <div
            className="card"
            style={{
              padding: 20,
              borderRadius: 14,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Overall Score
            </div>
            <div style={{ fontSize: 40, fontWeight: 900 }}>
              {latest?.score ?? "--"}
              <span style={{ fontSize: 16, opacity: 0.5 }}>/ 100</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Based on latest attempt
            </div>
          </div>

          {/* Right card: How it works */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontWeight: 700 }}>How it works</h4>
            <ul
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginTop: 8,
                paddingLeft: 20,
                display: "grid",
                gap: 4,
              }}
            >
              <li>AI evaluates your video responses.</li>
              <li>Scores 5 soft skills using ML models.</li>
              <li>Improves with more attempts.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontWeight: 800 }}>Skill Breakdown</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
          Average across all attempts
        </p>
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {[
            { key: "appearance", label: "Appearance" },
            { key: "language", label: "Language" },
            { key: "confidence", label: "Confidence" },
            { key: "contentDelivery", label: "Content Delivery" },
            { key: "knowledge", label: "Knowledge" },
          ].map(({ key, label }) => (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ opacity: 0.9 }}>{label}</span>
                <span style={{ opacity: 0.7 }}>
                  {skills[key] ?? 0} / 100
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  background: "rgba(255,255,255,0.08)",
                  height: 6,
                  borderRadius: 20,
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    width: `${skills[key] || 0}%`,
                    background:
                      "linear-gradient(90deg, rgba(58,160,255,1), rgba(34,210,230,0.9))",
                    height: "100%",
                    borderRadius: 20,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attempt history */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontWeight: 800 }}>Previous Attempts</h3>

        {attempts.length === 0 ? (
          <div style={{ marginTop: 10, color: "var(--muted)" }}>
            No attempts yet. Start your first mock interview!
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ width: "100%", fontSize: 14 }}>
              <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Score</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Appearance</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Language</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Confidence</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Delivery</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Knowledge</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const d = a.takenAt ? new Date(a.takenAt) : null;
                  const details = a.details || {};
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px" }}>
                        {d ? d.toLocaleDateString() : "--"}
                      </td>
                      <td style={{ padding: "12px", fontWeight: 700 }}>{a.score}</td>
                      <td style={{ padding: "12px" }}>{details.appearance ?? "--"}</td>
                      <td style={{ padding: "12px" }}>{details.language ?? "--"}</td>
                      <td style={{ padding: "12px" }}>{details.confidence ?? "--"}</td>
                      <td style={{ padding: "12px" }}>{details.contentDelivery ?? "--"}</td>
                      <td style={{ padding: "12px" }}>{details.knowledge ?? "--"}</td>
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