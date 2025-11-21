import { useEffect } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";

export default function UploadJDAlias() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/recruiter/job-profiles");
  }, [router]);

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold">Job Descriptions</h1>
      <p className="text-sm opacity-80 mt-2">Redirecting to Job Postings & Descriptions…</p>
    </div>
  );
}

UploadJDAlias.getLayout = function getLayout(page) {
  const RecruiterLayout = require("../../components/recruiter/RecruiterLayout").default;
  return <RecruiterLayout active="job-profiles">{page}</RecruiterLayout>;
};
