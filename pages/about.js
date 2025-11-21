// pages/about.js
import Layout from '../components/Layout';

export default function AboutPage() {
  return (
    <Layout>
      <main className="min-h-screen flex flex-col items-center justify-start pt-24 pb-16 px-4">
        <section className="w-full max-w-5xl">
          <h1 className="text-3xl font-semibold mb-4">About Recruiver</h1>
          <p className="text-base leading-relaxed mb-2">
            Recruiver is an AI-powered smart hiring platform that helps candidates
            and recruiters streamline the hiring process with resume ATS scoring,
            AI mock interviews, and personalized job recommendations.
          </p>
          <p className="text-base leading-relaxed">
            Use the navigation above to go back to your dashboard, resume ATS,
            or any other section of the portal.
          </p>
        </section>
      </main>
    </Layout>
  );
}
