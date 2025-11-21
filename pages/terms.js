// pages/terms.js
import Layout from "@/components/Layout";

function Terms() {
  return (
    <div style={{ width: "100%" }}>
      {/* Hero */}
      <section className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Terms of Use</h1>
        <p style={{ color: "var(--muted)", maxWidth: 980 }}>
          Welcome to Recruiver. These Terms of Use (“Terms”) govern your access to and use of
          the Recruiver platform, services, and related websites (collectively, the “Service”).
          By accessing or using the Service, you agree to be bound by these Terms.
        </p>
      </section>

      {/* Sections */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>1) Eligibility & Accounts</h3>
          <p style={{ color: "var(--muted)" }}>
            You must be legally capable of forming a binding contract in your jurisdiction to use the
            Service. You are responsible for maintaining the confidentiality of your account
            credentials and for all activities that occur under your account.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>2) Acceptable Use</h3>
          <p style={{ color: "var(--muted)" }}>
            You agree not to misuse the Service, including but not limited to: (a) violating any
            applicable laws or regulations; (b) uploading harmful, deceptive, or infringing content;
            (c) attempting to access another user’s account; (d) interfering with the integrity or
            performance of the platform; or (e) reverse-engineering components of the Service.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>3) AI, ATS & Scoring Disclaimer</h3>
          <p style={{ color: "var(--muted)" }}>
            Recruiver provides AI-assisted features such as resume parsing, ATS scoring, summarization,
            and interview analysis. These outputs are probabilistic and directional, and should not be
            treated as definitive advice or decisions. Recruiters and institutions remain solely
            responsible for hiring decisions and ensuring fairness, non-discrimination, and compliance
            with applicable laws and policies.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>4) Privacy</h3>
          <p style={{ color: "var(--muted)" }}>
            Your use of the Service is also governed by our Privacy Policy. We collect and process
            personal data to provide and improve the Service, operate assessments, and communicate
            with you. We do not sell personal data. See the Privacy page for details.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>5) Content & Intellectual Property</h3>
          <p style={{ color: "var(--muted)" }}>
            You retain ownership of content you upload but grant Recruiver a limited license to
            host, process, and display it to operate the Service. The Service, including software,
            design, and trademarks, is owned by Recruiver or its licensors and protected by
            intellectual property laws. You may not copy or redistribute platform components unless
            expressly permitted.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>6) Third-Party Services</h3>
          <p style={{ color: "var(--muted)" }}>
            The Service may link to third-party websites or integrate with providers (e.g., cloud
            storage, identity, or video services). We are not responsible for third-party content or
            practices. Use of such services may be subject to their separate terms and policies.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>7) Warranties & Disclaimers</h3>
          <p style={{ color: "var(--muted)" }}>
            The Service is provided on an “as is” and “as available” basis without warranties of any
            kind, whether express or implied, including but not limited to merchantability, fitness for
            a particular purpose, and non-infringement. We do not warrant that the Service will be
            uninterrupted, error-free, or that data will be accurate or secure.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>8) Limitation of Liability</h3>
          <p style={{ color: "var(--muted)" }}>
            To the maximum extent permitted by law, Recruiver will not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits, data,
            or goodwill, arising from your use of the Service. Our aggregate liability for any claim
            will not exceed the amount you paid (if any) for the Service during the preceding
            twelve (12) months.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>9) Suspension & Termination</h3>
          <p style={{ color: "var(--muted)" }}>
            We may suspend or terminate your access if you violate these Terms or pose risk to the
            platform or other users. You may stop using the Service at any time. Certain provisions
            will survive termination, including ownership, disclaimers, and limitations of liability.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>10) Governing Law & Dispute Resolution</h3>
          <p style={{ color: "var(--muted)" }}>
            These Terms are governed by the laws of <em>[Your Jurisdiction]</em>, without regard to its
            conflict of laws principles. Any disputes will be subject to the exclusive jurisdiction of
            the courts located in <em>[Your City/State]</em>.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>11) Changes to These Terms</h3>
          <p style={{ color: "var(--muted)" }}>
            We may update these Terms from time to time. Material changes will be notified via the
            platform or by email where appropriate. Continued use of the Service after changes
            constitutes acceptance of the revised Terms.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>12) Contact</h3>
          <p style={{ color: "var(--muted)" }}>
            For questions about these Terms, please contact us at{" "}
            <span style={{ fontWeight: 600 }}>support@recruiver.app</span> (or your institution/TPO
            contact if applicable).
          </p>
        </div>
      </section>
    </div>
  );
}

/** Use shared Layout so the header/topbar appears here as on the dashboard. */
Terms.getLayout = (page) => <Layout active="terms">{page}</Layout>;

export default Terms;
