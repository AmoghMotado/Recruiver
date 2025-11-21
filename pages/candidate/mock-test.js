import Link from "next/link";
import Layout from "../../components/Layout";

export default function MockTestIntro() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Mock Aptitude Test (AI)</h1>
        <p className="opacity-80 mt-2 text-sm">
          Get exam-ready with our simulated aptitude test. We’ll show a live timer, track your visited and
          attempted questions, and generate quick AI-style tips based on your performance at the end.
        </p>
        <p className="opacity-80 mt-1 text-sm">
          You’ll be asked to enable your camera and microphone for a realistic, proctored experience
          (preview only—no recording).
        </p>

        <div className="mt-6 flex justify-end">
          <Link href="/candidate/mock-test-instructions" className="btn primary">
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}

MockTestIntro.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="mock-test">
      {page}
    </Layout>
  );
};
