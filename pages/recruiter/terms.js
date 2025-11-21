import RecruiterLayout from "@/components/recruiter/RecruiterLayout";

export default function RecruiterTerms() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Terms of Use — Recruiter Portal</h1>

      <div className="card p-4 space-y-3 text-sm">
        <p>
          These Terms apply to the Recruiter Portal. By accessing or using this portal,
          your organization agrees to comply with these Terms.
        </p>

        <section>
          <h2 className="font-semibold">1. License & Access</h2>
          <p>
            We grant recruiters a limited, non-transferable license to use the portal
            to create jobs, manage applications, and communicate with candidates.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. Recruiter Responsibilities</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>Post accurate job information and remove outdated roles.</li>
            <li>Use candidate data only for hiring purposes.</li>
            <li>Comply with applicable employment and privacy laws.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">3. Prohibited Use</h2>
          <p>
            No scraping, re-selling, reverse engineering, or unauthorized sharing of candidate data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Availability & Changes</h2>
          <p>
            Features may change and downtime may occur. We’re not liable for indirect or consequential losses.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Termination</h2>
          <p>
            We may suspend or terminate access for violations of these Terms or misuse of the portal.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">6. Contact</h2>
          <p>
            For questions about these Terms, contact your account administrator.
          </p>
        </section>
      </div>
    </div>
  );
}

RecruiterTerms.getLayout = (page) => (
  <RecruiterLayout active="terms">{page}</RecruiterLayout>
);
