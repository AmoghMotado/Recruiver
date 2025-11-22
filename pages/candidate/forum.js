// pages/candidate/forum.js
import { useEffect, useState, useRef } from "react";
import Layout from "@/components/Layout";

function CandidateForum() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages + simple polling
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/forum/messages");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load");
        if (alive) setMessages(data.messages || []);
      } catch (e) {
        console.error(e);
      }
    }

    load();
    const id = setInterval(load, 3000); // every 3s
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const send = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/forum/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send");
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      setInput("");
    } catch (e) {
      alert(e.message);
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

  return (
    <div className="space-y-8 pb-8 flex flex-col h-screen">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Community Forum</h1>
        <p className="text-lg text-gray-600 mt-3">
          Connect with other candidates, share experiences, ask questions, and discuss opportunities
        </p>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-8"
          style={{
            background: "linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)",
          }}
        >
          {messages.length === 0 ? (
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
                <div
                  key={m.id}
                  className={`flex gap-4 animate-fadeIn ${
                    idx === messages.length - 1 ? "pb-2" : ""
                  }`}
                  style={{
                    animation: `fadeIn 0.3s ease-in-out`,
                  }}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-bold text-lg">
                      {(m.authorName || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-bold text-gray-900 text-base">
                        {m.authorName || "Candidate"}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-gray-800 text-base leading-relaxed">
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
        <div className="border-t border-gray-200 bg-white p-8">
          <div className="max-w-4xl">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Share your thoughts
            </label>
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={3}
                  placeholder="Share a doubt, experience, resource, or ask a question…"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 font-medium text-base focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  style={{
                    fontFamily: "inherit",
                  }}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                  Press Enter + Shift to add a new line
                </div>
              </div>
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className={`px-8 py-3 rounded-lg font-bold text-base whitespace-nowrap transition-all ${
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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

CandidateForum.getLayout = (page) => (
  <Layout role="CANDIDATE" active="forum">
    {page}
  </Layout>
);

export default CandidateForum;