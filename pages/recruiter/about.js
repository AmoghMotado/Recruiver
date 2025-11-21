import RecruiterLayout from "@/components/recruiter/RecruiterLayout";

export default function RecruiterAbout() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">About Recruiter Portal</h1>
      <p className="text-gray-300">
        The Recruiter Portal is designed to help companies manage their
        **end-to-end hiring process** efficiently. It allows recruiters to
        create job postings, view applications in real time, and track candidate
        progress in one centralized platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-semibold text-lg mb-2">🎯 Our Goal</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            To simplify the recruitment journey by providing an easy-to-use
            dashboard for posting jobs, managing applications, and shortlisting
            the right candidates faster.
          </p>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-lg mb-2">🧭 Key Features</h2>
          <ul className="list-disc ml-5 space-y-1 text-gray-300 text-sm">
            <li>Post and manage job openings effortlessly.</li>
            <li>View candidate applications in real time.</li>
            <li>Filter and search applicants by skill, location, or experience.</li>
            <li>Track application progress through different hiring stages.</li>
          </ul>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-lg mb-2">📌 Why Use This Portal</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          This platform helps recruiters save time and resources while improving
          hiring accuracy. By combining ATS scoring, job management, and real-time
          candidate data, it ensures a **smarter and faster** recruitment
          process.
        </p>
      </div>
    </div>
  );
}

RecruiterAbout.getLayout = function getLayout(page) {
  return <RecruiterLayout active="about">{page}</RecruiterLayout>;
};
