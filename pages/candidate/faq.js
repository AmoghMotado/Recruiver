// pages/faq.js
import { useState } from "react";
import Layout from "@/components/Layout";

const faqItems = [
  {
    q: "How does ATS work here?",
    a:
      "We parse your resume against the job description, extract skills/experience/education, and compute matching signals. Recruiters see a concise view to shortlist faster.",
  },
  {
    q: "What are the typical rounds?",
    a:
      "R1: Resume + ATS shortlisting. R2: Aptitude/technical (can be proctored). R3: Structured interview or video responses with AI-assisted summaries.",
  },
  {
    q: "Is the aptitude test proctored?",
    a:
      "If enabled by the recruiter/TPO, we monitor focus switches and camera snapshots as allowed by policy. Proctoring level is visible before you start.",
  },
  {
    q: "How is my data used?",
    a:
      "Only for hiring workflows you participate in. We minimize collection, retain data for required durations, and never sell personal data.",
  },
  {
    q: "How do I sign in with Google?",
    a:
      "From Login, choose your Role, then click “Sign in with Google.” If your institute uses SSO, ensure you’re logged into the correct Google account.",
  },
  {
    q: "I get a role mismatch error on login.",
    a:
      "Pick the correct role (Candidate or Recruiter) before logging in. Accounts are role-scoped for the right dashboard and permissions.",
  },
  {
    q: "Can I update my resume after applying?",
    a:
      "Yes. Upload a new resume from your dashboard. Recruiters will see the most recent version and your ATS score will refresh.",
  },
  {
    q: "How is the ATS score calculated?",
    a:
      "We map your skills/keywords against the JD, check seniority/experience alignment, and weigh recency and relevancy. Scores are directional, not absolute.",
  },
  {
    q: "What if I face an issue during a test?",
    a:
      "Use the ‘Report an issue’ link shown inside the test page. If your internet drops, rejoin using the same link—progress is autosaved when possible.",
  },
  {
    q: "What’s the difference between Candidate and Recruiter dashboards?",
    a:
      "Candidates track applications, tests, and interviews. Recruiters configure pipelines, review shortlists, and move candidates across stages.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <div style={{ width: "100%" }}>
      {/* Header card */}
      <section className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>FAQ</h1>
        <p style={{ color: "var(--muted)", maxWidth: 980 }}>
          Answers to common questions about Recruiver’s ATS, rounds, sign-in, and privacy.
          If you don’t find what you’re looking for, contact your TPO or the recruiter.
        </p>
      </section>

      {/* Accordion */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {faqItems.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "18px 20px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span>{item.q}</span>
                <span
                  aria-hidden
                  style={{
                    transform: `rotate(${isOpen ? 180 : 0}deg)`,
                    transition: "transform .2s ease",
                    opacity: 0.8,
                  }}
                >
                  ▼
                </span>
              </button>

              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: isOpen ? "block" : "none",
                }}
              >
                <div style={{ padding: "14px 20px", color: "var(--muted)" }}>{item.a}</div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

/** Attach Layout so the top header/nav appears just like the dashboard. */
FAQ.getLayout = (page) => <Layout active="faq">{page}</Layout>;
