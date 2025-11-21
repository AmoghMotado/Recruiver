import RecruiterLayout from "@/components/recruiter/RecruiterLayout";

export default function RecruiterFAQ() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Recruiter FAQ</h1>
      <p className="text-gray-300">
        Here are some of the most common questions recruiters have about using the portal.
      </p>

      <div className="card p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">1. How do I create a new job posting?</h2>
          <p className="text-gray-300 text-sm">
            Go to the <strong>Job Postings</strong> section in the sidebar and click
            <strong> “Add New Job”</strong>. Fill in the required job details and save
            the posting. It will instantly appear for candidates to view.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">2. Can I edit or delete a job posting?</h2>
          <p className="text-gray-300 text-sm">
            Yes. In the Job Postings table, you can use the <strong>Edit</strong> or
            <strong>Delete</strong> buttons next to each job entry.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">3. How can I view applicants?</h2>
          <p className="text-gray-300 text-sm">
            Click <strong>View</strong> on the job posting to see the list of candidates
            who applied. You can also track their stage in the hiring process.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">4. How do I receive notifications?</h2>
          <p className="text-gray-300 text-sm">
            All new applications or status updates will appear in the
            <strong> Notifications </strong> bell icon in the top right corner of the dashboard.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">5. Can multiple recruiters use the same account?</h2>
          <p className="text-gray-300 text-sm">
            Yes, if the organization allows shared access. Each recruiter can manage
            their own postings or collaborate on the same job listings.
          </p>
        </div>
      </div>
    </div>
  );
}

RecruiterFAQ.getLayout = function getLayout(page) {
  return <RecruiterLayout active="faq">{page}</RecruiterLayout>;
};
