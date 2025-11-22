// pages/candidate/mock-test-intro.js
import Link from "next/link";
import Layout from "../../components/Layout";

export default function MockTestIntro() {
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Mock Aptitude Test</h1>
        <p className="text-lg text-gray-600 mt-3">
          Practice with a realistic, timed aptitude test. Get immediate feedback and AI-generated tips to
          improve.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 max-w-2xl">
        <div className="flex items-start gap-6">
          <div className="text-6xl">📝</div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Test Overview</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-3 text-lg">
                <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                <span className="text-gray-700">
                  <strong>10 questions</strong> drawn from{" "}
                  <strong>Quantitative Aptitude, Logical Reasoning, and Verbal / Communication</strong>
                </span>
              </li>
              <li className="flex gap-3 text-lg">
                <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                <span className="text-gray-700">
                  <strong>10 minutes</strong> total time with live countdown
                </span>
              </li>
              <li className="flex gap-3 text-lg">
                <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                <span className="text-gray-700">
                  <strong>Camera & microphone</strong> for proctored experience
                </span>
              </li>
              <li className="flex gap-3 text-lg">
                <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                <span className="text-gray-700">
                  <strong>Instant results</strong> with AI-style improvement tips by topic
                </span>
              </li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Your camera and microphone will be used for preview only—no recording
                takes place. This creates a realistic test environment.
              </p>
            </div>

            <Link
              href="/candidate/mock-test-instructions"
              className="inline-flex px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:shadow-lg transition-all"
            >
              Begin Test →
            </Link>
          </div>
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