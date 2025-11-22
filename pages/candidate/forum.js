
// ============================================
// FILE: pages/candidate/forum.js (ENHANCED)
// ============================================
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";

function CandidateForum() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forumReady, setForumReady] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastLoadRef = useRef(0);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from API
  const loadMessages = async () => {
    try {
      const now = Date.now();
      // Prevent too frequent requests
      if (now - lastLoadRef.current < 1000) {
        return;
      }
      lastLoadRef.current = now;

      const res = await fetch("/api/forum/messages");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to load messages");
      }

      setMessages(data.messages || []);
      setError("");
    } catch (e) {
      console.error("Error loading messages:", e);
      if (loading) {
        setError("Failed to load messages: " + e.message);
      }
    } finally {
      if (loading) {
        setLoading(false);
        setForumReady(true);
      }
    }
  };

  // Initial load and polling setup
  useEffect(() => {
    // Load messages immediately (auth not required for reading)
    loadMessages();

    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Ensure auth is loaded before showing input
  useEffect(() => {
    if (!authLoading) {
      setForumReady(true);
    }
  }, [authLoading]);

  // Send message to API
  const send = async () => {
    if (!input.trim()) {
      setError("Please type a message");
      return;
    }

    // Use demo user if not authenticated
    const currentUser = user || {
      uid: "demo-user-" + Math.random().toString(36).substring(7),
      displayName: "Anonymous Candidate",
      email: "anonymous@recruiver.local",
    };

    setSending(true);
    setError("");

    const messagePayload = {
      content: input.trim(),
      authorId: String(currentUser.uid),
      authorName: String(currentUser.displayName || currentUser.email || "Anonymous"),
      authorEmail: String(currentUser.email || ""),
    };

    console.log("Sending message:", messagePayload);

    try {
      const res = await fetch("/api/forum/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      });

      const data = await res.json();

      console.log("Response from API:", data);

      if (!res.ok || !data.success) {
        throw new Error(data?.message || data?.error || "Failed to send message");
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInput("");
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (e) {
      console.error("Error sending message:", e);
      setError("Failed to send: " + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  if (authLoading) {
    return (
      <Layout role="CANDIDATE" active="forum">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600 font-semibold">Authenticating...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="CANDIDATE" active="forum">
      <div className="space-y-6 pb-8 h-screen flex flex-col">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            Community Forum <span>💬</span>
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Connect with other candidates, share experiences, ask questions, and discuss opportunities
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm font-semibold">
            ❌ {error}
          </div>
        )}

        {/* Main Chat Container */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 overflow-hidden shadow-lg">
          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-8"
            style={{
              background: "linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p className="text-gray-600 font-semibold">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-2xl font-bold text-gray-900">No messages yet</h3>
                  <p className="text-lg text-gray-600 mt-2 max-w-md">
                    Be the first to start a conversation! Share your thoughts, questions, or experiences with the community.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {messages.map((m, idx) => (
                  <div key={m.id || `msg-${idx}`} className="flex gap-4 animate-fade-in">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white font-bold text-lg">
                        {(m.authorName || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-bold text-gray-900">
                          {m.authorName || "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "just now"}
                        </span>
                        {m.authorId === user?.uid && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {forumReady && (
            <div className="border-t border-gray-200 bg-white p-6 flex-shrink-0">
              <div className="max-w-4xl">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Share your thoughts
                </label>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      rows={3}
                      placeholder="Share a doubt, experience, resource, or ask a question…"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 text-base focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                      {input.length} / 1000
                    </div>
                  </div>
                  <button
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className={`px-6 py-3 rounded-lg font-bold text-base whitespace-nowrap transition-all ${
                      sending || !input.trim()
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg active:scale-95"
                    }`}
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Sending…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>📤</span>
                        Send
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }
        `}</style>
      </div>
    </Layout>
  );
}

export default CandidateForum;