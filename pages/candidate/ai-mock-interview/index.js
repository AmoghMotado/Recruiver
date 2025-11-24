// pages/candidate/ai-mock-interview/index.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { db } from "@/firebase/config";
import { useAuth } from "@/lib/auth";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
// Icons for the New Design
import { 
  Sparkles, 
  Video, 
  BarChart3, 
  Brain, 
  MessageSquare, 
  Trophy, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Target, 
  Clock, 
  Shield 
} from 'lucide-react';

export default function AIMockInterviewDashboard() {
  const router = useRouter();

  // 🔐 Auth 
  const auth = useAuth ? useAuth() : null;
  const user = auth && auth.user ? auth.user : null;
  const authLoading = auth && typeof auth.loading === "boolean" ? auth.loading : false;

  const [latestAttempt, setLatestAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingInterview, setStartingInterview] = useState(false);
  const [startError, setStartError] = useState(null);
  
  // State for new design interactions
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // --- Constants for New Design ---
  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      title: "Real-Time Video Analysis",
      description: "Advanced AI tracks your eye contact, body language, and facial expressions during the interview.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Speech & Communication",
      description: "Get instant feedback on your speaking pace, filler words, clarity, and communication effectiveness.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Scoring",
      description: "Comprehensive evaluation across 5 key parameters using GPT-4 technology for detailed insights.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Detailed Analytics",
      description: "View your performance metrics, sentiment analysis, and personalized improvement suggestions.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const benefits = [
    "Practice unlimited times at your own pace",
    "Get instant, unbiased AI feedback",
    "Improve confidence before real interviews",
    "Track your progress over multiple sessions",
    "Receive personalized coaching tips",
    "No human judgment, just honest feedback"
  ];

  const metricsDisplay = [
    { label: "Appearance & Body Language", icon: <Target className="w-5 h-5" /> },
    { label: "Language Proficiency", icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Confidence & Tone", icon: <Zap className="w-5 h-5" /> },
    { label: "Content Delivery", icon: <CheckCircle2 className="w-5 h-5" /> },
    { label: "Technical Knowledge", icon: <Brain className="w-5 h-5" /> }
  ];

  // --- Logic ---

  useEffect(() => {
    loadLatestAttempt();
  }, []);

  const loadLatestAttempt = async () => {
    try {
      const qRef = query(
        collection(db, "mockInterviewAttempts"),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(qRef);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const normalized = normalizeLatestAttempt(doc.id, doc.data());
        setLatestAttempt(normalized);
      } else {
        setLatestAttempt(null);
      }
    } catch (error) {
      console.error("Error loading attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewInterview = async () => {
    try {
      setStartError(null);

      // While auth is still loading, just prevent double-clicks
      if (authLoading) return;

      setStartingInterview(true);

      // ✅ Always provide a userId so the API never rejects with "userId is required"
      const currentUserId =
        (user && (user.uid || user.id || user.userId || user.firebaseId)) ||
        "demoUser123"; // fallback so the flow *always* works

      const res = await fetch("/api/mock-interview/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start interview");
      }

      router.push(
        `/candidate/ai-mock-interview/live?interviewId=${data.interviewId}`
      );
    } catch (error) {
      console.error("Error starting interview:", error);
      setStartError(
        error.message ||
          "Unable to start the interview. Please refresh the page and try again."
      );
    } finally {
      setStartingInterview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner">⚙️</div>
          <p style={{ marginTop: 20, color: "var(--muted)" }}>
            Loading your results...
          </p>
        </div>
        {/* Reuse the old spinner style */}
        <style jsx>{`
          .loading-spinner {
            font-size: 48px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={!latestAttempt ? "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" : "space-y-6"}>
      
      {latestAttempt ? (
        /* =========================================================================
           EXISTING DASHBOARD VIEW (PRESERVED)
           ========================================================================= */
        <>
           {/* Header */}
            <div className="card" style={{ padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
                    🤖 AI Mock Interview
                    </h1>
                    <p style={{ color: "var(--muted)", fontSize: 16 }}>
                    Practice with AI-powered feedback and real-time analysis
                    </p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <button
                    className="btn primary btn-start-interview"
                    onClick={startNewInterview}
                    disabled={startingInterview || authLoading}
                    >
                    {startingInterview
                        ? "Preparing interview..."
                        : "🎤 Start New Interview"}
                    </button>
                    {startError && (
                    <p style={{ marginTop: 8, fontSize: 12, color: "#ef4444", maxWidth: 260 }}>
                        {startError}
                    </p>
                    )}
                </div>
                </div>
            </div>

            {/* Overall Score */}
            <div className="card score-overview" style={{ padding: 40, textAlign: "center" }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--muted)", marginBottom: 15 }}>
                    Your Overall Performance
                </h2>
                <div className="overall-score-circle">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                    <circle
                        cx="100" cy="100" r="90" fill="none" stroke="url(#scoreGradient)" strokeWidth="12"
                        strokeDasharray={`${(latestAttempt.overallScore / 100) * 565} 565`}
                        strokeLinecap="round" transform="rotate(-90 100 100)" className="score-progress"
                    />
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    </svg>
                    <div className="score-text">
                    <div className="score-number">{latestAttempt.overallScore}</div>
                    <div className="score-label">/100</div>
                    </div>
                </div>
                <div style={{ marginTop: 25 }}>
                    <span className={`performance-badge ${getPerformanceLevel(latestAttempt.overallScore)}`}>
                    {getPerformanceLabel(latestAttempt.overallScore)}
                    </span>
                </div>
            </div>

            {/* Core Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 15 }}>
                <MetricCard title="Appearance" score={latestAttempt.appearance} icon="👔" color="#3b82f6" />
                <MetricCard title="Language" score={latestAttempt.language} icon="💬" color="#8b5cf6" />
                <MetricCard title="Confidence" score={latestAttempt.confidence} icon="💪" color="#ec4899" />
                <MetricCard title="Delivery" score={latestAttempt.contentDelivery} icon="🎯" color="#f59e0b" />
                <MetricCard title="Knowledge" score={latestAttempt.knowledge} icon="🧠" color="#10b981" />
            </div>

            {/* AI Insights */}
            <div className="card ai-insights-section" style={{ padding: 30 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
                    🤖 AI-Powered Insights
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                    {/* Sentiment */}
                    <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon">😊</span>
                        <h3 className="insight-title">Sentiment Analysis</h3>
                    </div>
                    <div className="insight-score-bar">
                        <div className="insight-score-fill sentiment" style={{ width: `${latestAttempt.sentimentScore || 0}%` }} />
                    </div>
                    <div className="insight-value">{latestAttempt.sentimentScore || 0}/100</div>
                    <p className="insight-feedback">
                        {latestAttempt.sentimentSummary || "Overall neutral to positive tone detected."}
                    </p>
                    </div>

                    {/* Eye contact */}
                    <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon">👁️</span>
                        <h3 className="insight-title">Eye Contact</h3>
                    </div>
                    <div className="insight-score-bar">
                        <div className="insight-score-fill eye-contact" style={{ width: `${latestAttempt.eyeContactScore || 0}%` }} />
                    </div>
                    <div className="insight-value">{latestAttempt.eyeContactScore || 0}/100</div>
                    <p className="insight-feedback">
                        {latestAttempt.eyeContactScore > 70
                        ? "✅ Excellent eye contact maintained throughout."
                        : latestAttempt.eyeContactScore > 40
                        ? "🙂 Eye contact is okay; try to look at the camera more consistently."
                        : "⚠️ Eye contact was weak — focus more on looking at the camera."}
                    </p>
                    </div>

                    {/* Speaking pace */}
                    <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon">⚡</span>
                        <h3 className="insight-title">Speaking Pace</h3>
                    </div>
                    <div className="insight-badge-group">
                        <span className={`insight-badge ${latestAttempt.aggregatedInsights.averageWPM > 160 ? "fast" : latestAttempt.aggregatedInsights.averageWPM < 90 ? "slow" : "normal"}`}>
                        {latestAttempt.aggregatedInsights.averageWPM} WPM
                        </span>
                        <span className="insight-label">
                        {latestAttempt.aggregatedInsights.averageWPM > 160
                            ? "Too Fast"
                            : latestAttempt.aggregatedInsights.averageWPM < 90
                            ? "Too Slow"
                            : "Perfect"}
                        </span>
                    </div>
                    <p className="insight-feedback">
                        {latestAttempt.aggregatedInsights.averageWPM > 160
                        ? "Slow down slightly for better clarity and understanding."
                        : latestAttempt.aggregatedInsights.averageWPM < 90
                        ? "Speed up a bit to sound more confident and engaging."
                        : "✅ Excellent speaking pace maintained."}
                    </p>
                    </div>

                    {/* Filler words */}
                    <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon">🔊</span>
                        <h3 className="insight-title">Filler Words</h3>
                    </div>
                    <div className="insight-badge-group">
                        <span className={`insight-badge ${latestAttempt.aggregatedInsights.totalFillers > 15 ? "high" : latestAttempt.aggregatedInsights.totalFillers > 8 ? "medium" : "low"}`}>
                        {latestAttempt.aggregatedInsights.totalFillers} detected
                        </span>
                        <span className="insight-label">
                        {latestAttempt.aggregatedInsights.totalFillers > 15
                            ? "High Usage"
                            : latestAttempt.aggregatedInsights.totalFillers > 8
                            ? "Moderate"
                            : "Excellent"}
                        </span>
                    </div>
                    <p className="insight-feedback">
                        {latestAttempt.aggregatedInsights.totalFillers > 15
                        ? "⚠️ Try to minimise 'um', 'uh', and 'like' for a more professional delivery."
                        : "✅ Great job keeping filler words low!"}
                    </p>
                    </div>
                </div>

                {/* Emotional tone summary */}
                <div className="emotional-tone-card" style={{ marginTop: 25, padding: 20, background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))", borderRadius: 12, border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: "#8b5cf6" }}>
                    💬 Emotional Tone Summary
                    </h3>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text)" }}>
                    {latestAttempt.emotionalTone || "Professional and confident delivery with balanced emotional tone."}
                    </p>
                </div>
            </div>

            {/* Video recording */}
            {latestAttempt.answers && latestAttempt.answers.length > 0 && (
                <div className="card" style={{ padding: 30 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
                    📹 Interview Recording
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                    {latestAttempt.answers.map((answer, idx) => (
                        <div key={idx} className="video-card">
                        <div style={{ position: "relative", background: "#000", borderRadius: 8, overflow: "hidden", aspectRatio: "16/9" }}>
                            {answer.videoUrl ? (
                            <video controls style={{ width: "100%", height: "100%", objectFit: "cover" }} src={answer.videoUrl} />
                            ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
                                📹 Video not available
                            </div>
                            )}
                        </div>
                        <div style={{ padding: 15 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                            Question {idx + 1}
                            </h4>
                            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                            {answer.question}
                            </p>
                            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                            <span className="mini-badge">{answer.speakingPace || "normal"} pace</span>
                            <span className="mini-badge">{answer.fillerUsage || "low"} fillers</span>
                            <span className="mini-badge">{answer.eyeContact || "stable"} gaze</span>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
        </>
      ) : (
        /* =========================================================================
           NEW LANDING PAGE DESIGN (EMPTY STATE)
           ========================================================================= */
        <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-16">
            {/* Header Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-600">AI-Powered Interview Practice</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Master Your Interview Skills
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  With AI-Powered Feedback
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Practice with our advanced AI interviewer that analyzes your performance in real-time, 
                providing instant feedback on communication, body language, and content delivery.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col items-center justify-center mb-16 gap-4">
              <button 
                onClick={startNewInterview}
                disabled={startingInterview || authLoading}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {startingInterview ? (
                     // Simple spinner for button
                     <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                     <Sparkles className="w-6 h-6" />
                  )}
                  {startingInterview ? "Preparing Interview..." : "Start Your AI Mock Interview"}
                  {!startingInterview && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              {startError && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                  {startError}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  5 min
                </div>
                <div className="text-gray-600 font-medium">Average Interview Time</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  5+
                </div>
                <div className="text-gray-600 font-medium">Evaluation Metrics</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  Instant
                </div>
                <div className="text-gray-600 font-medium">AI-Powered Results</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI analyzes every aspect of your interview performance to help you improve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredFeature(idx)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Metrics */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl text-white">
            <div className="text-center mb-10">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
              <h2 className="text-4xl font-bold mb-4">What You'll Be Evaluated On</h2>
              <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
                Comprehensive AI analysis across multiple dimensions of interview performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {metricsDisplay.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all text-center"
                >
                  <div className="flex justify-center mb-3">
                    {metric.icon}
                  </div>
                  <div className="font-semibold text-sm leading-tight">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Practice With Our AI Interviewer?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Perfect your interview skills in a safe, judgment-free environment. 
                Get the practice you need to ace your real interviews with confidence.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 group-hover:bg-green-200 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">5-Minute Sessions</div>
                        <div className="text-sm text-gray-600">Quick, focused practice</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">100% Private</div>
                        <div className="text-sm text-gray-600">Your data stays secure</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Instant Results</div>
                        <div className="text-sm text-gray-600">Immediate feedback</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
            
            <div className="relative z-10">
              <Sparkles className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Interview Skills?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join thousands of candidates who've improved their interview performance with AI-powered practice
              </p>
              
              <button 
                onClick={startNewInterview}
                disabled={startingInterview || authLoading}
                className="group inline-flex items-center gap-3 bg-white text-indigo-600 px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                <Sparkles className="w-6 h-6" />
                {startingInterview ? "Preparing..." : "Start Your First Interview Now"}
                {!startingInterview && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
              </button>
              
              <p className="text-indigo-100 text-sm mt-6">
                No credit card required • Takes only 5 minutes • Instant AI feedback
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Preserve Styles for the DASHBOARD View (Latest Attempt View) */}
      <style jsx>{`
        .btn-start-interview {
          padding: 12px 28px;
          font-size: 16px;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          color: white;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        .btn-start-interview:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-start-interview:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }
        .score-overview {
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.05),
            rgba(139, 92, 246, 0.05)
          );
          border: 1px solid rgba(59, 130, 246, 0.15);
        }
        .overall-score-circle {
          position: relative;
          display: inline-block;
        }
        .score-progress {
          transition: stroke-dasharray 1s ease-out;
        }
        .score-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .score-number {
          font-size: 56px;
          font-weight: 900;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }
        .score-label {
          font-size: 18px;
          color: var(--muted);
          margin-top: 4px;
        }
        .performance-badge {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
        }
        .performance-badge.excellent { background: #10b981; color: white; }
        .performance-badge.good { background: #3b82f6; color: white; }
        .performance-badge.average { background: #f59e0b; color: white; }
        .performance-badge.needs-improvement { background: #ef4444; color: white; }
        .ai-insights-section { animation: slideIn 0.5s ease-out; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .insight-card {
          padding: 20px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        .insight-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
        .insight-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
        .insight-icon { font-size: 24px; }
        .insight-title { font-size: 16px; font-weight: 700; margin: 0; }
        .insight-score-bar {
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .insight-score-fill { height: 100%; border-radius: 4px; transition: width 1s ease-out; }
        .insight-score-fill.sentiment { background: linear-gradient(90deg, #f59e0b, #10b981); }
        .insight-score-fill.eye-contact { background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
        .insight-value { font-size: 24px; font-weight: 800; color: #3b82f6; margin-bottom: 8px; }
        .insight-feedback { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 0; }
        .insight-badge-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .insight-badge { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 18px; }
        .insight-badge.normal, .insight-badge.low { background: #10b981; color: white; }
        .insight-badge.medium { background: #f59e0b; color: white; }
        .insight-badge.high, .insight-badge.fast, .insight-badge.slow { background: #ef4444; color: white; }
        .insight-label { font-size: 13px; color: var(--muted); font-weight: 600; }
        .video-card {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        .video-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
        .mini-badge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

function MetricCard({ title, score, icon, color }) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ color }}>{icon}</div>
      <div className="metric-title">{title}</div>
      <div className="metric-score" style={{ color }}>{score}</div>
      <div className="metric-bar">
        <div className="metric-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <style jsx>{`
        .metric-card {
          padding: 20px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        .metric-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
        .metric-icon { font-size: 32px; margin-bottom: 12px; }
        .metric-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .metric-score { font-size: 36px; font-weight: 900; margin-bottom: 12px; }
        .metric-bar {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        .metric-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease-out; }
      `}</style>
    </div>
  );
}

function getPerformanceLevel(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "average";
  return "needs-improvement";
}

function getPerformanceLabel(score) {
  if (score >= 85) return "🏆 Excellent Performance";
  if (score >= 70) return "✅ Good Performance";
  if (score >= 55) return "⚠️ Average Performance";
  return "📈 Needs Improvement";
}

/**
 * Normalise Firestore document (flat structure from mockInterviewAttempts)
 * into the shape expected by the dashboard UI.
 */
function normalizeLatestAttempt(id, data) {
  const appearance = data.appearance ?? 0;
  const language = data.language ?? 0;
  const confidence = data.confidence ?? 0;
  const contentDelivery = data.contentDelivery ?? 0;
  const knowledge = data.knowledge ?? 0;

  const baseScores = [
    appearance,
    language,
    confidence,
    contentDelivery,
    knowledge,
  ].filter((v) => typeof v === "number");

  const overallScore =
    data.overallScore ??
    (baseScores.length
      ? Math.round(baseScores.reduce((a, b) => a + b, 0) / baseScores.length)
      : 0);

  const sentimentScore = data.sentimentScore ?? 0;
  const sentimentSummary = data.sentimentSummary || null;

  const eyeContactScore = Math.round(data.eyeContactPercent ?? 0);
  const emotionalTone = data.emotionalTone || null;

  let averageWPM =
    typeof data.wpm === "number" ? Math.round(data.wpm) : null;
  if (
    averageWPM == null &&
    typeof data.wordCount === "number" &&
    typeof data.durationSec === "number" &&
    data.durationSec > 0
  ) {
    averageWPM = Math.round(
      data.wordCount / Math.max(1, data.durationSec / 60)
    );
  }
  if (averageWPM == null) averageWPM = 120;

  const totalFillers =
    typeof data.fillerCount === "number" ? data.fillerCount : 0;

  const speakingPaceLabel =
    data.speakingPace ||
    (averageWPM > 160 ? "fast" : averageWPM < 90 ? "slow" : "normal");

  const fillerUsage =
    data.fillerUsage ||
    (totalFillers > 15 ? "high" : totalFillers > 8 ? "medium" : "low");

  const eyeContactLabel =
    data.eyeContactLabel ||
    (eyeContactScore > 70
      ? "stable"
      : eyeContactScore > 40
      ? "variable"
      : "weak");

  const answers = [
    {
      videoUrl: data.videoUrl || null,
      question: "Full mock interview recording",
      speakingPace: speakingPaceLabel,
      fillerUsage,
      eyeContact: eyeContactLabel,
    },
  ];

  return {
    id,
    overallScore,
    appearance,
    language,
    confidence,
    contentDelivery,
    knowledge,
    sentimentScore,
    sentimentSummary,
    eyeContactScore,
    emotionalTone,
    aggregatedInsights: {
      averageWPM,
      totalFillers,
    },
    answers,
  };
}

AIMockInterviewDashboard.getLayout = (page) => (
  <Layout role="CANDIDATE" active="ai-mock">
    {page}
  </Layout>
);