// pages/faq.js
import Layout from '../components/Layout';

export default function FAQPage() {
  return (
    <Layout>
      <main className="min-h-screen flex flex-col items-center justify-start pt-24 pb-16 px-4">
        <section className="w-full max-w-5xl">
          <h1 className="text-3xl font-semibold mb-4">Frequently Asked Questions</h1>

          <div className="space-y-4 text-base leading-relaxed">
            <div>
              <h2 className="font-medium">1. How do I use Resume ATS?</h2>
              <p>
                Go to the Resume ATS section from the sidebar, upload your resume,
                and you&apos;ll get an ATS score with suggestions for improvement.
              </p>
            </div>

            <div>
              <h2 className="font-medium">2. How do I practice with the AI Mock Interview?</h2>
              <p>
                Open the AI Mock Interview section, start a new session, and answer
                the questions. You&apos;ll later see feedback based on multiple metrics.
              </p>
            </div>

            <div>
              <h2 className="font-medium">3. How do I go back to my dashboard?</h2>
              <p>
                Use the top navigation or the Recruiver logo to return to your
                candidate dashboard at any time.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
