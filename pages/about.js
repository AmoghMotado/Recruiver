// pages/about.js
import Layout from "@/components/Layout";

function About() {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">About Recruiver</h1>
        <p className="text-2xl text-gray-600 max-w-3xl leading-relaxed">
          We're building the future of fair, transparent, and intelligent hiring. 
          Recruiver combines AI-powered resume parsing, structured assessments, and human-centered 
          evaluation to help universities and organizations hire the right talent—faster, fairer, and smarter.
        </p>
      </section>

      {/* Mission & Values */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-8">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h3>
          <p className="text-lg text-gray-700 leading-relaxed">
            Eliminate hiring bias through structured, data-driven processes that give every candidate a fair shot and every recruiter actionable insights.
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-8">
          <div className="text-4xl mb-4">⚖️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Values</h3>
          <ul className="text-lg text-gray-700 space-y-2">
            <li>✓ <strong>Transparency</strong> at every step</li>
            <li>✓ <strong>Fairness</strong> for all candidates</li>
            <li>✓ <strong>Privacy</strong> by design</li>
            <li>✓ <strong>Efficiency</strong> that scales</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-8">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h3>
          <p className="text-lg text-gray-700 leading-relaxed">
            A world where hiring decisions are based on merit, potential, and fit—not luck or timing. Where candidates know exactly where they stand.
          </p>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="bg-white rounded-xl border border-gray-200 p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Problem</h2>
            <ul className="space-y-4 text-lg text-gray-700">
              <li className="flex gap-4">
                <span className="text-red-500 text-2xl flex-shrink-0">⚠️</span>
                <span><strong>Inconsistent evaluation:</strong> Same candidate gets different scores from different interviewers</span>
              </li>
              <li className="flex gap-4">
                <span className="text-red-500 text-2xl flex-shrink-0">⚠️</span>
                <span><strong>Manual bottlenecks:</strong> Recruiters drown in resumes; few get reviewed thoroughly</span>
              </li>
              <li className="flex gap-4">
                <span className="text-red-500 text-2xl flex-shrink-0">⚠️</span>
                <span><strong>Candidate frustration:</strong> No feedback, long waits, unclear next steps</span>
              </li>
              <li className="flex gap-4">
                <span className="text-red-500 text-2xl flex-shrink-0">⚠️</span>
                <span><strong>Bias & blind spots:</strong> Gut feel over structured signals</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Solution</h2>
            <ul className="space-y-4 text-lg text-gray-700">
              <li className="flex gap-4">
                <span className="text-emerald-500 text-2xl flex-shrink-0">✓</span>
                <span><strong>Structured scoring:</strong> Consistent rubrics, clear signals, less subjectivity</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 text-2xl flex-shrink-0">✓</span>
                <span><strong>AI-powered screening:</strong> Parse, match, and summarize at scale</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 text-2xl flex-shrink-0">✓</span>
                <span><strong>Candidate transparency:</strong> Real-time updates, clear progression, timely feedback</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 text-2xl flex-shrink-0">✓</span>
                <span><strong>Data-driven insights:</strong> Focus on fit, not paperwork</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section>
        <h2 className="text-4xl font-bold text-gray-900 mb-12">Core Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: "📄",
              title: "Intelligent ATS Parsing",
              desc: "Upload resumes and watch us extract skills, experience, education, and keywords instantly. Get a structured view that recruiters can search and filter.",
            },
            {
              icon: "🎯",
              title: "Smart Matching",
              desc: "Compare candidate profiles against job descriptions using AI. Get keyword coverage, semantic similarity, and skill alignment scores.",
            },
            {
              icon: "📊",
              title: "Aptitude & Technical Tests",
              desc: "Build custom tests or use pre-built assessments. Run proctored exams with AI monitoring and instant scoring.",
            },
            {
              icon: "🎬",
              title: "Video Interview Evaluation",
              desc: "AI analyzes video responses for appearance, language, confidence, and delivery. Panels get summaries, not raw footage.",
            },
            {
              icon: "🔍",
              title: "Candidate Tracking",
              desc: "Candidates see their exact stage, how they performed, and what's next. Real-time notifications keep everyone informed.",
            },
            {
              icon: "⚡",
              title: "Pipeline Automation",
              desc: "Auto-advance qualified candidates, bulk operations, templated communications. Save hours on admin work.",
            },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-lg text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hiring Flow */}
      <section className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-12">How Recruiver Powers Your Hiring</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              title: "Create & Parse",
              desc: "Post jobs and parse incoming resumes. Get instant ATS scores and structured data.",
            },
            {
              step: 2,
              title: "Screen & Test",
              desc: "Run aptitude or technical tests. AI flags top performers automatically.",
            },
            {
              step: 3,
              title: "Interview & Evaluate",
              desc: "Collect video responses or hold panel interviews with structured rubrics and AI summaries.",
            },
            {
              step: 4,
              title: "Decide & Notify",
              desc: "Make offers or rejections with clear feedback. Automate notifications to keep candidates informed.",
            },
          ].map((step, i) => (
            <div key={i} className="bg-white rounded-xl border border-indigo-200 p-8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                {step.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-700">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Recruiver */}
      <section>
        <h2 className="text-4xl font-bold text-gray-900 mb-12">Why Choose Recruiver?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">For Candidates</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-lg">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span className="text-gray-700">Know exactly where you stand in every stage</span>
                </li>
                <li className="flex gap-3 text-lg">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span className="text-gray-700">Get AI-powered tips to improve your resume and interview skills</span>
                </li>
                <li className="flex gap-3 text-lg">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span className="text-gray-700">Receive timely feedback and updates automatically</span>
                </li>
                <li className="flex gap-3 text-lg">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span className="text-gray-700">Practice with mock interviews and aptitude tests</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">For Recruiters & TPOs</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-lg">
                  <span className="text-emerald-600 font-bold">→</span>
                  <span className="text-gray-700">Reduce time-to-hire by 50% with smart screening</span>
                </li>
                <li className="flex gap-3 text-lg">
                  <span className="text-emerald-600 font-bold">→</span>
                  <span className="text-gray-700">Make better hiring decisions with data, not gut feel</span>
                </li>
                <li className="flex gap-3 text-lg">
                  <span className="text-emerald-600 font-bold">→</span>
                  <span className="text-gray-700">Automate repetitive tasks and scale your pipeline</span>
                </li>
                <li className="flex gap-3 text-lg">
                  <span className="text-emerald-600 font-bold">→</span>
                  <span className="text-gray-700">Improve candidate experience and employer brand</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-12 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to transform your hiring?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join hundreds of organizations using Recruiver to make smarter hiring decisions.
        </p>
        <button className="px-8 py-4 text-lg font-bold bg-white text-indigo-600 rounded-xl hover:bg-gray-100 transition-all">
          Get Started Today
        </button>
      </section>
    </div>
  );
}

About.getLayout = (page) => <Layout active="about">{page}</Layout>;

export default About;

