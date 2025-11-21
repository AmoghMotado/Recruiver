import RecruiterLayout from "@/components/recruiter/RecruiterLayout";

export default function RecruiterPrivacy() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Privacy Policy — Recruiter Portal</h1>

      <div className="card p-4 space-y-3 text-sm">
        <p>
          This Privacy Policy explains how the Recruiter Portal processes organizational and candidate data
          when accessed by recruiter accounts.
        </p>

        <section>
          <h2 className="font-semibold">1. Data We Process</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>Recruiter account info (name, email, organization)</li>
            <li>Job postings and related metadata</li>
            <li>Candidate applications and interactions</li>
            <li>Technical logs for security and performance</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">2. How We Use Data</h2>
          <p>
            To operate the portal, show applications in real time, diagnose issues, and improve features.
            Candidate data is shown to recruiters only for hiring activities.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Sharing</h2>
          <p>
            We don’t sell data. Limited sharing may occur with infrastructure providers under strict agreements.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Security</h2>
          <p>
            We implement administrative, technical, and physical safeguards. No system is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Retention</h2>
          <p>
            Data is retained as required for service operation and legal obligations. You may request deletion
            through your admin where applicable.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">6. Contact</h2>
          <p>
            For privacy requests about the Recruiter Portal, contact your organization’s admin.
          </p>
        </section>
      </div>
    </div>
  );
}

RecruiterPrivacy.getLayout = (page) => (
  <RecruiterLayout active="privacy">{page}</RecruiterLayout>
);
