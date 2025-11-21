// pages/about.js
import Layout from "@/components/Layout";

function About() {
  return (
    <div style={{ width: "100%" }}>
      {/* Hero */}
      <section
        className="card"
        style={{
          padding: 28,
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>About</h1>
        <p style={{ color: "var(--muted)", maxWidth: 980 }}>
          Recruiver is an AI-powered hiring platform that helps universities and
          recruiters run structured, fair, and fast hiring processes. Candidates get
          transparent progression and timely updates; recruiters get smart screening,
          actionable insights, and automation where it matters.
        </p>
      </section>

      {/* Highlights */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 18,
          marginBottom: 22,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>ATS Parsing</div>
          <div style={{ color: "var(--muted)" }}>
            Parse resumes into clean, structured data (skills, experience, education)
            for instant search and matching.
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Aptitude & Rounds</div>
          <div style={{ color: "var(--muted)" }}>
            Configure online tests and multi-stage pipelines. Auto-advance qualified
            candidates to the next round.
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>AI-Assisted Screening</div>
          <div style={{ color: "var(--muted)" }}>
            Summaries and signals for video/voice answers and resumes to help panels
            focus on fit—not paperwork.
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="card"
        style={{ padding: 24, display: "grid", gap: 14, marginBottom: 22 }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>
          How Recruiver Works
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              step: "1",
              title: "Upload & Parse",
              desc:
                "Recruiters upload JDs; candidates upload resumes. ATS parsing structures everything.",
            },
            {
              step: "2",
              title: "Screen & Test",
              desc:
                "Configure aptitude/technical rounds. AI flags strengths and risks early.",
            },
            {
              step: "3",
              title: "Interview",
              desc:
                "Panels review shortlists with concise AI summaries and consistent rubrics.",
            },
            {
              step: "4",
              title: "Decide & Notify",
              desc:
                "Move candidates, make offers, and automatically notify everyone with clear next steps.",
            },
          ].map((x) => (
            <div key={x.step} className="card ghost" style={{ padding: 16 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(90deg, rgba(91,140,255,.25), rgba(34,211,238,.25))",
                  marginBottom: 10,
                  fontWeight: 800,
                }}
              >
                {x.step}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{x.title}</div>
              <div style={{ color: "var(--muted)" }}>{x.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values / CTA */}
      <section
        className="card"
        style={{ padding: 24, display: "flex", gap: 18, flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Fair & Transparent</div>
          <div style={{ color: "var(--muted)" }}>
            Clear rubrics, consistent evaluation, and candidate-friendly updates across the funnel.
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Privacy-First</div>
          <div style={{ color: "var(--muted)" }}>
            We minimize data collection and keep everything scoped to the hiring workflow.
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Built for Teams</div>
          <div style={{ color: "var(--muted)" }}>
            Role-aware dashboards for recruiters, TPOs, and candidates with clear ownership.
          </div>
        </div>
      </section>
    </div>
  );
}

/** Attach the shared Layout so the top header appears here too. */
About.getLayout = (page) => <Layout active="about">{page}</Layout>;

export default About;
