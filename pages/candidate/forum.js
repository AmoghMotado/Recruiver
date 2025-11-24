// ============================================
// FILE: pages/candidate/forum.js
// ============================================
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { 
  Send, 
  MessageSquare, 
  Clock, 
  User, 
  Loader2, 
  AlertCircle, 
  Users
} from "lucide-react";

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
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const now = Date.now();
      if (now - lastLoadRef.current < 1000) return;
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
      if (loading) setError("Failed to load messages: " + e.message);
    } finally {
      if (loading) {
        setLoading(false);
        setForumReady(true);
      }
    }
  };

  useEffect(() => {
    loadMessages();

    pollIntervalRef.current = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setForumReady(true);
    }
  }, [authLoading]);

  const send = async () => {
    if (!input.trim()) {
      setError("Please type a message");
      return;
    }

    const currentUser = user || {
      uid: "demo-user-" + Math.random().toString(36).substring(7),
      displayName: "Anonymous Candidate",
      email: "anonymous@recruiver.local",
    };

    setSending(true);
    setError("");

    const payload = {
      content: input.trim(),
      authorId: String(currentUser.uid),
      authorName: String(
        currentUser.displayName || currentUser.email || "Anonymous"
      ),
      authorEmail: String(currentUser.email || ""),
    };

    try {
      const res = await fetch("/api/forum/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.message || data?.error || "Failed to send message");
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInput("");
        setTimeout(scrollToBottom, 100);
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

  const formatTimestamp = (value) => {
    if (!value) return "just now";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "just now";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <Layout role="CANDIDATE" active="forum">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] bg-slate-50">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium animate-pulse">Connecting to secure forum...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="CANDIDATE" active="forum">
      <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
        
        {/* Top Header Section */}
        <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100 px-6 py-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Community Forum</h1>
            </div>
            <p className="text-sm text-gray-500">Discuss interview experiences and get help from peers</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
             <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
             </div>
             <div className="text-xs text-gray-400 font-medium">
               {messages.length} messages loaded
             </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 p-3 flex items-center justify-center gap-2 text-red-700 text-sm font-semibold animate-slide-down">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
               <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-400" />
               <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                <MessageSquare className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No messages yet</h3>
              <p className="text-gray-500 max-w-sm">
                Be the first to start a conversation! Share your thoughts or ask a question.
              </p>
            </div>
          ) : (
            // REMOVED: max-w-4xl mx-auto to allow full width
            <div className="w-full space-y-8">
              {messages.map((m, idx) => {
                const isOwnMessage = m.authorId === user?.uid;
                
                return (
                  <div 
                    key={m.id || `msg-${idx}`} 
                    className={`flex gap-4 ${isOwnMessage ? "flex-row-reverse" : "flex-row"} group animate-fade-in w-full`}
                  >
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border-2 ${
                        isOwnMessage 
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-100" 
                          : "bg-gradient-to-br from-gray-100 to-gray-200 border-white"
                      }`}>
                      {isOwnMessage ? (
                         <User className="w-6 h-6 text-white" />
                      ) : (
                         <span className="text-gray-600 font-bold text-base">
                           {(m.authorName || "A").charAt(0).toUpperCase()}
                         </span>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[85%] ${isOwnMessage ? "items-end" : "items-start"}`}>
                      
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className={`text-sm font-bold ${isOwnMessage ? "text-indigo-900" : "text-gray-700"}`}>
                          {isOwnMessage ? "You" : (m.authorName || "Anonymous")}
                        </span>
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {formatTimestamp(m.createdAt)}
                        </span>
                      </div>

                      {/* INCREASED FONT SIZE HERE: text-base md:text-lg */}
                      <div className={`
                        px-6 py-4 rounded-2xl shadow-sm text-base md:text-lg leading-relaxed break-words relative
                        ${isOwnMessage 
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm" 
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"}
                      `}>
                         {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {forumReady && (
          <div className="bg-white/90 backdrop-blur-md border-t border-indigo-50 p-4 md:p-6 z-20">
             {/* REMOVED: max-w-4xl mx-auto to allow full width */}
             <div className="w-full relative">
                <div className={`
                    flex gap-2 items-end bg-gray-50 border transition-all rounded-2xl p-2
                    ${sending ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:bg-white"}
                `}>
                   <div className="flex-1">
                      <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        rows={1}
                        className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 resize-none max-h-32 min-h-[50px] text-lg" // Increased font size in input
                        placeholder="Type your message here..."
                        style={{ fieldSizing: "content" }}
                      />
                   </div>
                   
                   <button
                      onClick={send}
                      disabled={sending || !input.trim()}
                      className={`
                        p-4 rounded-xl flex-shrink-0 transition-all duration-200
                        ${sending || !input.trim() 
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                          : "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95"}
                      `}
                   >
                      {sending ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Send className="w-6 h-6" />
                      )}
                   </button>
                </div>
                
                <div className="text-right mt-2 text-xs text-gray-400 font-medium px-2">
                   {input.length}/1000 characters
                </div>
             </div>
          </div>
        )}

      </div>
      
      {/* Animation Styles */}
      <style jsx>{`
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes bounce {
           0%, 100% { transform: translateY(-5%); }
           50% { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
           animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
           from { transform: translateY(-100%); opacity: 0; }
           to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </Layout>
  );
}

export default CandidateForum;