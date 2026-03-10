import React, { useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import "./AgentAI.css";

const MOCK_RESPONSES = [
  "Here’s a quick summary: focus on the core ideas first, then add details and examples so future-you can remember why they mattered.",
  "If this were an exam question, I’d structure the answer in three parts: definition, key steps, and one concrete example.",
  "Think of this topic as a story: what’s the setup, what’s the main conflict, and how is it resolved? Turn each piece into a short note.",
];

function AgentAI() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: "assistant",
      text: "Hi! I’m your Note Agent. Ask me anything about your notes, lectures, or topics you’re studying.",
    },
  ]);
  const [sending, setSending] = useState(false);

  const canSend = input.trim().length > 0 && !sending;

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Pick a random mock response
    const reply = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: reply,
        },
      ]);
      setSending(false);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const reversedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content agentai-content">
          <div className="agentai-chat">
            <div className="agentai-messages">
              {reversedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`agentai-message agentai-message-${msg.role}`}
                >
                  <div className="agentai-message-bubble">{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="agentai-input-row">
              <textarea
                className="agentai-input"
                rows={2}
                placeholder="Ask the Note Agent a question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="agentai-send-btn"
                onClick={handleSend}
                disabled={!canSend}
              >
                {sending ? "Thinking…" : "Send"}
              </button>
            </div>
            <p className="agentai-hint">
              Responses are mocked for now — when the backend LLM is wired up, this will stream real answers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentAI;
