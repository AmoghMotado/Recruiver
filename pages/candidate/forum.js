// pages/candidate/forum.js
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

function CandidateForum() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // load + simple polling
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
    const id = setInterval(load, 7000); // every 7s
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

  return (
    <div className="card" style={{ padding: 20, display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Candidate Forum</h2>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Ask doubts, share resources, and discuss opportunities with other candidates.
          </div>
        </div>
      </header>

      {/* Messages list */}
      <div
        className="card ghost"
        style={{
          maxHeight: "55vh",
          overflowY: "auto",
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              padding: 10,
              borderRadius: 10,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>
              {m.authorName || "Candidate"} ·{" "}
              {new Date(m.createdAt).toLocaleString()}
            </div>
            <div style={{ fontSize: 14 }}>{m.content}</div>
          </div>
        ))}
      </div>

      {/* Input box */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="Share a doubt, experience, or resource…"
          style={{
            flex: 1,
            resize: "none",
            padding: 10,
            borderRadius: 10,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "inherit",
            fontSize: 14,
          }}
        />
        <button
          className="btn primary"
          disabled={sending || !input.trim()}
          onClick={send}
          style={{ whiteSpace: "nowrap", height: "fit-content" }}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

CandidateForum.getLayout = (page) => (
  <Layout role="CANDIDATE" active="forum">
    {page}
  </Layout>
);

export default CandidateForum;
