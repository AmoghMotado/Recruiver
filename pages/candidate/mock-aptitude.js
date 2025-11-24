// pages/candidate/mock-aptitude.js
import Link from "next/link";
import Layout from "../../components/Layout";
import { 
  ClipboardList, 
  Timer, 
  ShieldCheck, 
  Zap, 
  Brain, 
  Calculator, 
  MessageSquare, 
  Code2, 
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function MockAptitude() {
  
  const testSections = [
    { title: "Quantitative", count: 15, icon: <Calculator className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Logical Reasoning", count: 15, icon: <Brain className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Verbal Ability", count: 15, icon: <MessageSquare className="w-5 h-5" />, color: "text-pink-600", bg: "bg-pink-50" },
    { title: "Programming", count: 15, icon: <Code2 className="w-5 h-5" />, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const features = [
    {
      title: "60 Minutes Duration",
      desc: "Global live countdown timer. Auto-submits when time ends.",
      icon: <Timer className="w-6 h-6 text-orange-500" />
    },
    {
      title: "AI-Assisted Proctoring",
      desc: "Camera monitoring, tab-switch detection & violation tracking.",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Instant Analysis",
      desc: "Get overall score, section-wise breakdown & improvement tips.",
      icon: <Zap className="w-6 h-6 text-yellow-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-white/50 relative">
          
          {/* Decorative Background Blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

          <div className="p-8 md:p-12 relative z-10">
            
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full mb-6">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Skill Assessment</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Comprehensive <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Aptitude Test</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Evaluate your technical, logical, and verbal skills in a simulated exam environment designed to prepare you for real recruitment drives.
              </p>
            </div>

            {/* Test Pattern Cards (The 15/15/15/15 Breakdown) */}
            <div className="mb-12">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Test Pattern Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {testSections.map((section, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className={`p-3 rounded-xl ${section.bg} ${section.color} mb-3`}>
                      {section.icon}
                    </div>
                    <div className="font-bold text-gray-900 text-lg">{section.count}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase">{section.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {features.map((feature, idx) => (
                <div key={idx} className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-1">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Privacy Note */}
            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-6 mb-10 flex gap-4 items-start">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Proctoring Requirements</h4>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                  Your camera and microphone will be active during the exam for AI proctoring. 
                  Streams are monitored in real-time for violations (like tab switching or multiple faces) 
                  and are automatically stopped when the test is submitted.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/candidate/mock-test-instructions"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 transition-all duration-300"
              >
                <span>Begin Assessment</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <p className="text-xs text-gray-400 font-medium">
                Make sure you are in a quiet environment before starting
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

MockAptitude.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="mock-test">
      {page}
    </Layout>
  );
};