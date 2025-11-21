// components/ChatWidget.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";

export default function ChatWidget() {
  // avoid SSR mismatch, only render into body after mount
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // chat state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm your Recruiver Assistant. Ask me anything about your dashboard, ATS scores, mock tests, or job applications.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const scrollRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // auto-scroll to latest message
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isOpen]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setErrorText("");

    try {
      setLoading(true);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.error ||
          (res.status === 401 || res.status === 403
            ? "You need to be logged in to use the assistant."
            : "Something went wrong talking to the assistant.");
        setErrorText(msg);
        return;
      }

      const reply = data.reply || "Sorry, I couldn't generate a response.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setErrorText("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          // place just above footer; adjust 80px if your footer is taller/shorter
          bottom: "80px",
          right: "30px",
          zIndex: 2147483647, // max priority on top of everything
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          pointerEvents: "none", // container ignores clicks; children re-enable
        }}
      >
        {/* Chat window */}
        {isOpen && (
          <div
            style={{
              width: "320px",
              height: "400px",
              background: "rgba(20,22,30,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              marginBottom: "14px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backdropFilter: "blur(10px)",
              pointerEvents: "auto", // re-enable clicks inside
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 14px",
                background: "linear-gradient(90deg,#4f46e5,#4f46e5)",
                color: "#fff",
                fontWeight: 800,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Chat Assistant</span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 16,
                }}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                padding: 12,
                color: "#ddd",
                fontSize: 13,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent:
                      m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "8px 10px",
                      borderRadius: 10,
                      background:
                        m.role === "user"
                          ? "linear-gradient(90deg,#4f46e5,#4f46e5)"
                          : "rgba(31,41,55,0.95)",
                      color: "#fff",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Assistant is typing…
                </div>
              )}
              {errorText && (
                <div style={{ fontSize: 12, color: "#fca5a5" }}>
                  {errorText}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              style={{
                padding: 10,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                gap: 8,
              }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  borderRadius: 8,
                  outline: "none",
                  fontSize: 13,
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  background: "linear-gradient(90deg,#4f46e5,#4f46e5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: loading || !input.trim() ? "default" : "pointer",
                  fontWeight: 700,
                  opacity: loading || !input.trim() ? 0.7 : 1,
                }}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Floating FAB */}
        <button
          onClick={() => setIsOpen((s) => !s)}
          style={{
            background: "linear-gradient(90deg,#4f46e5,#4f46e5)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: 30,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            boxShadow: "0 10px 24px rgba(79,70,229,0.35)",
            cursor: "pointer",
            border: "none",
            pointerEvents: "auto", // clickable
          }}
          aria-label="Toggle chat"
          title="Chat"
        >
          <MessageCircle size={20} />
          Chat
        </button>
      </div>
    </>,
    // render on body so it ignores layout stacking/overflow issues
    document.body
  );
}
