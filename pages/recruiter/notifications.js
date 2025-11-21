import { useEffect } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";

export default function NotificationsDeprecated() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/recruiter/dashboard");
  }, [router]);

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <p className="text-sm opacity-80 mt-2">Notifications moved to the header bell icon.</p>
    </div>
  );
}

NotificationsDeprecated.getLayout = function getLayout(page) {
  const RecruiterLayout = require("../../components/recruiter/RecruiterLayout").default;
  return <RecruiterLayout active="dashboard">{page}</RecruiterLayout>;
};
