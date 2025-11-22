// pages/faq.js
import { useState } from "react";
import Layout from "@/components/Layout";

const faqCategories = {
  "Getting Started": [
    {
      q: "What is Recruiver?",
      a: "Recruiver is an AI-powered hiring platform that helps organizations and universities run fair, structured, and efficient hiring processes. We combine resume parsing, aptitude testing, video interviews, and candidate tracking in one platform.",
    },
    {
      q: "How do I sign up?",
      a: "Sign up is simple: Visit the login page, select your role (Candidate or Recruiter), and click 'Sign in with Google.' If your institute uses SSO, use your institutional email. Make sure you're logged into the correct Google account.",
    },
    {
      q: "Why do I need to choose a role during signup?",
      a: "Roles determine your dashboard experience and permissions. Candidates see applications and practice tools. Recruiters manage pipelines and make hiring decisions. Your role-specific dashboard is optimized for your workflow.",
    },
  ],
  "For Candidates": [
    {
      q: "How does resume parsing and ATS scoring work?",
      a: "When you upload your resume, our AI extracts your skills, experience, education, and keywords. We compare this against the job description to calculate an ATS score based on keyword coverage, skill alignment, and experience relevance. The score is directional and helps recruiters understand your fit quickly.",
    },
    {
      q: "Can I update my resume after applying?",
      a: "Yes! Upload a new version from your dashboard anytime. Recruiters will see your most recent resume, and your ATS score will refresh automatically. This is great if you want to tailor your resume for different roles.",
    },
    {
      q: "What if I fail the aptitude test?",
      a: "Different pipelines have different policies. Some allow retakes, others don't. Check the job posting for details. If you're struggling, use our mock test feature to practice and improve before taking the actual test.",
    },
    {
      q: "Are the video interviews recorded?",
      a: "That depends on the pipeline. Some interviews are live with a panel; others are recorded so panels can review them later. You'll see the interview format before you start, so there are no surprises.",
    },
    {
      q: "How do I prepare for interviews?",
      a: "Use our AI Mock Interview feature to practice. Record yourself answering common interview questions, and our AI will score you on appearance, language, confidence, delivery, and knowledge. Get feedback and tips to improve.",
    },
    {
      q: "When will I hear back about my application?",
      a: "You'll get automatic updates at each stage. If you don't hear back within the posted timeline, reach out to the recruiter or TPO directly. We send notifications via email, so keep your inbox checked.",
    },
  ],
  "For Recruiters": [
    {
      q: "How do I set up a hiring pipeline?",
      a: "Create a job posting with details like role, location, required skills, and salary. Then configure your pipeline: Round 1 (resume shortlisting), Round 2 (aptitude/technical test), Round 3 (interviews). You can customize scoring rubrics and auto-advance rules for each round.",
    },
    {
      q: "How does candidate shortlisting work?",
      a: "Our ATS scores candidates based on resume alignment with your job description. You can filter by score, skills, experience, and other criteria. The system suggests top matches, but you make the final shortlist decision.",
    },
    {
      q: "Can I create custom aptitude tests?",
      a: "Yes. You can build custom tests from scratch, upload your own questions, or use pre-built templates from our library. Set time limits, question types, and passing scores. The system auto-grades MCQs instantly.",
    },
    {
      q: "What video interview features do you offer?",
      a: "You can collect recorded responses to standard questions or run live interviews with panels. Our AI generates summaries of video responses (appearance, language clarity, confidence) so your panel can focus on fit instead of note-taking.",
    },
    {
      q: "How do I move candidates between stages?",
      a: "Use bulk operations to move candidates, or drag-and-drop them in your pipeline view. Set rules to auto-advance candidates who meet thresholds (e.g., score >= 70). Notifications are sent automatically.",
    },
    {
      q: "Can I send feedback to rejected candidates?",
      a: "Yes. Create templated rejection messages or write custom feedback. Candidates receive notifications immediately, which improves your employer brand and reduces inbound complaints.",
    },
  ],
  "Privacy & Security": [
    {
      q: "What data do you collect from me?",
      a: "We collect only data necessary for hiring workflows: resume, basic profile info, test responses, and interview recordings. We don't collect unnecessary personal information and don't sell data to third parties.",
    },
    {
      q: "How long do you keep my data?",
      a: "Data retention depends on local regulations and your organization's policy. Typically, candidate data is retained for 1-3 years post-hire or post-rejection. You can request deletion anytime.",
    },
    {
      q: "Is the platform GDPR and data privacy compliant?",
      a: "Yes. We follow GDPR, data localization requirements, and other privacy regulations. We use encryption, secure servers, and minimal data practices. Contact us for detailed compliance documentation.",
    },
    {
      q: "Who has access to my resume and videos?",
      a: "Only the recruiting team and authorized panelists have access. Candidates can see their own data. Recruiters can't share your data outside the hiring process without permission.",
    },
  ],
  "Technical Support": [
    {
      q: "My camera/microphone isn't working during the test.",
      a: "Check your browser permissions (Chrome address bar > camera icon). Allow camera and microphone access. Refresh the page if needed. If still stuck, use the 'Report Issue' button in the test to contact support immediately.",
    },
    {
      q: "I got disconnected during a test. What happens to my progress?",
      a: "We auto-save your answers regularly. If your internet drops, rejoin using the same test link within 15 minutes and continue from where you left off. If the test timer ran out, you may need to contact the recruiter.",
    },
    {
      q: "What browsers and devices are supported?",
      a: "We support Chrome, Firefox, Safari, and Edge on desktop/laptop. For tests requiring video, desktop/laptop is strongly recommended. Mobile is supported for viewing applications and status only.",
    },
    {
      q: "How do I contact support if I'm stuck?",
      a: "Use the 'Help' link in the left sidebar or the chat widget (bottom right). For urgent issues during tests, use the 'Report Issue' button. Our support team responds within a few hours.",
    },
  ],
};

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("Getting Started");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const currentFAQs = faqCategories[activeCategory] || [];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <section>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-2xl text-gray-600 max-w-3xl">
          Can't find what you're looking for? Check the categories below or reach out to our support team.
        </p>
      </section>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-3">
        {Object.keys(faqCategories).map((category) => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              setExpandedIndex(null);
            }}
            className={`px-6 py-3 rounded-lg font-bold text-base transition-all ${
              activeCategory === category
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg"
                : "bg-white border-2 border-gray-300 text-gray-900 hover:border-indigo-400"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {currentFAQs.map((item, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="w-full text-left px-8 py-6 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-bold text-gray-900 flex-1">{item.q}</h3>
                <div
                  className={`flex-shrink-0 text-2xl text-indigo-600 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
                  <p className="text-lg text-gray-700 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still Need Help */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Our support team is here to help. Reach out via chat, email, or contact your recruiter or TPO directly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all">
              💬 Start Chat
            </button>
            <button className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-all">
              📧 Email Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

FAQ.getLayout = (page) => <Layout active="faq">{page}</Layout>;