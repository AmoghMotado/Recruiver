import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

export default function MockAptitudeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/candidate/mock-test");
  }, [router]);

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold">Mock Aptitude Test</h1>
      <p className="opacity-80 mt-2 text-sm">Loading the updated test experience…</p>
    </div>
  );
}

MockAptitudeRedirect.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="mock-test">
      {page}
    </Layout>
  );
};
