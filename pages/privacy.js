// pages/privacy.js
import Layout from "@/components/Layout";

function Privacy() {
  return (
    <div style={{ width: "100%" }}>
      {/* Hero */}
      <section className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "var(--muted)", maxWidth: 980 }}>
          This Privacy Policy explains how Recruiver (“we”, “us”, “our”) collects, uses, and
          safeguards personal information when you use our platform and related services
          (“Service”). By using the Service, you consent to the practices described below.
        </p>
      </section>

      {/* Sections */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>1) Information We Collect</h3>
          <ul style={{ color: "var(--muted)", marginLeft: 18, lineHeight: 1.7 }}>
            <li><b>Account & Identity:</b> name, email, role (Candidate/Recruiter), institute/company details.</li>
            <li><b>Application Data:</b> resumes/CVs, skills, education, experience, responses to tests/interviews.</li>
            <li><b>Usage Data:</b> device/browser details, IP address, pages visited, timestamps, referring URLs.</li>
            <li><b>Assessment Signals:</b> ATS parsing output, scores, flags, summaries, proctoring indicators (if enabled).</li>
            <li><b>Support & Feedback:</b> messages and attachments you share with us.</li>
          </ul>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>2) How We Use Information</h3>
          <ul style={{ color: "var(--muted)", marginLeft: 18, lineHeight: 1.7 }}>
            <li>Provide and improve the Service (hosting, dashboards, ATS parsing, assessments).</li>
            <li>Authenticate users and maintain security.</li>
            <li>Generate AI-assisted summaries and scores to assist recruiters and candidates.</li>
            <li>Send essential communications (account, status updates, interview notifications).</li>
            <li>Monitor reliability, detect abuse, and comply with legal obligations.</li>
          </ul>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>3) Legal Bases (where applicable)</h3>
          <p style={{ color: "var(--muted)" }}>
            We process data based on: (a) performance of a contract (providing the Service);
            (b) legitimate interests (security, improvement, fraud prevention);
            (c) consent (where required, e.g., certain cookies/proctoring);
            and (d) legal compliance.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>4) Data Retention</h3>
          <p style={{ color: "var(--muted)" }}>
            We retain personal data only as long as necessary for the purposes stated in this
            Policy, to meet legal or audit requirements, or as directed by your institute/company
            (if your account is managed by an organization). You may request deletion where feasible.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>5) Sharing & Disclosure</h3>
          <ul style={{ color: "var(--muted)", marginLeft: 18, lineHeight: 1.7 }}>
            <li><b>Recruiters/TPOs:</b> Candidate application data is shared with the relevant recruiters or training/placement offices to run hiring processes.</li>
            <li><b>Service Providers:</b> Hosting, storage, analytics, communications, and proctoring vendors under confidentiality obligations.</li>
            <li><b>Legal/Compliance:</b> When required by applicable law, regulation, or valid legal process.</li>
            <li><b>Business Transfers:</b> In connection with a merger, acquisition, or asset sale, with appropriate protections.</li>
          </ul>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>6) Cookies & Similar Technologies</h3>
          <p style={{ color: "var(--muted)" }}>
            We use essential cookies for sign-in and session management, and may use analytics cookies
            to understand usage and improve performance. Where required, we will request consent for
            non-essential cookies. You can manage cookies via your browser settings.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>7) Security</h3>
          <p style={{ color: "var(--muted)" }}>
            We implement technical and organizational measures appropriate to the risk, including
            encryption in transit, access controls, and monitoring. No method of transmission or storage
            is 100% secure; we strive to protect your data but cannot guarantee absolute security.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>8) Your Rights</h3>
          <ul style={{ color: "var(--muted)", marginLeft: 18, lineHeight: 1.7 }}>
            <li>Access, correction, deletion, and export of your personal data (subject to applicable law).</li>
            <li>Object to or restrict certain processing; withdraw consent where processing is based on consent.</li>
            <li>Contact your institute/company administrator for organization-managed accounts.</li>
          </ul>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>9) Children’s Privacy</h3>
          <p style={{ color: "var(--muted)" }}>
            The Service is intended for university/college recruitment and is not directed to children
            under the age required by local laws. If you believe a minor provided data without appropriate
            authorization, contact us to remove it.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>10) International Transfers</h3>
          <p style={{ color: "var(--muted)" }}>
            Your information may be processed in countries other than your own. Where we transfer data
            internationally, we use lawful mechanisms (such as contractual protections) to safeguard it.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>11) Changes to this Policy</h3>
          <p style={{ color: "var(--muted)" }}>
            We may update this Policy from time to time. Material changes will be communicated through
            the platform or by email where appropriate. Continued use of the Service signifies acceptance
            of the updated Policy.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>12) Contact Us</h3>
          <p style={{ color: "var(--muted)" }}>
            Questions or requests? Reach us at{" "}
            <span style={{ fontWeight: 600 }}>privacy@recruiver.app</span> or via your organization
            administrator/TPO.
          </p>
        </div>
      </section>
    </div>
  );
}

/** Use shared Layout so the header/topbar appears here as on the dashboard. */
Privacy.getLayout = (page) => <Layout active="privacy">{page}</Layout>;

export default Privacy;
