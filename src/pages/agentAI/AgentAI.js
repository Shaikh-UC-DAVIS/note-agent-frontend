import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import {
  chatWithWorkspace,
  fetchNoteInsights,
  fetchNotes,
  fetchWorkspaces,
} from "../../api/client";
import { FileText, Send } from "lucide-react";
import "./AgentAI.css";

const PROMPT_OPTIONS = [
  "Show contradictions",
  "What are the key ideas?",
  "Any open questions/tasks?",
];

function normalizePrompt(input) {
  const text = (input || "").toLowerCase();
  if (text.includes("contradict")) return "Show contradictions";
  if (text.includes("key") && text.includes("idea")) return "What are the key ideas?";
  if (
    text.includes("question") ||
    text.includes("task") ||
    text.includes("next step")
  ) {
    return "Any open questions/tasks?";
  }
  return null;
}

function summarizeFromInsights(prompt, selectedNotes, insightsByNoteId) {
  if (!selectedNotes.length) {
    return {
      title: "No notes selected",
      items: ["Pick at least one note first so I can load insights."],
    };
  }

  if (prompt === "Show contradictions") {
    const groups = [];
    selectedNotes.forEach((note) => {
      const noteItems = [];
      const dedupe = new Set();
      const data = insightsByNoteId[note.id];
      const contradictions = (data?.insights || []).filter(
        (insight) => insight.type === "contradiction"
      );
      contradictions.forEach((insight) => {
        const sourceText = insight.payload?.source_text || "statement A";
        const targetText = insight.payload?.target_text || "statement B";
        const pair = [sourceText, targetText].sort().join("::");
        const key = pair;
        if (!dedupe.has(key)) {
          dedupe.add(key);
          noteItems.push(`${sourceText} vs ${targetText}`);
        }
      });
      if (noteItems.length) {
        groups.push({
          noteTitle: note.title || "Untitled",
          items: noteItems.slice(0, 6),
        });
      }
    });
    return {
      title: "Potential contradictions",
      groups,
      emptyMessage: "No contradictions found in the selected notes.",
    };
  }

  if (prompt === "What are the key ideas?") {
    const groups = [];
    selectedNotes.forEach((note) => {
      const noteIdeas = [];
      const dedupe = new Set();
      const data = insightsByNoteId[note.id];
      const objects = (data?.objects || [])
        .filter((obj) => ["Idea", "Claim", "Definition", "Evidence"].includes(obj.type))
        .slice(0, 4);
      objects.forEach((obj) => {
        const key = `${note.id}:${obj.canonical_text}`;
        if (!dedupe.has(key)) {
          dedupe.add(key);
          noteIdeas.push(obj.canonical_text);
        }
      });
      if (noteIdeas.length) {
        groups.push({
          noteTitle: note.title || "Untitled",
          items: noteIdeas,
        });
      }
    });
    return {
      title: "Top ideas from selected notes",
      groups,
      emptyMessage: "No key ideas were extracted yet for these notes.",
    };
  }

  const groups = [];
  selectedNotes.forEach((note) => {
    const noteItems = [];
    const dedupe = new Set();
    const data = insightsByNoteId[note.id];
    const openItems = ((data?.objects || [])
      .filter((obj) => ["Task", "Question"].includes(obj.type))
      .slice(0, 5));
    openItems.forEach((obj) => {
      const key = `${obj.type}:${obj.canonical_text}`;
      if (!dedupe.has(key)) {
        dedupe.add(key);
        noteItems.push(`(${obj.type}) ${obj.canonical_text}`);
      }
    });
    if (noteItems.length) {
      groups.push({
        noteTitle: note.title || "Untitled",
        items: noteItems,
      });
    }
  });
  return {
    title: "Open questions and tasks",
    groups,
    emptyMessage: "No open questions or tasks found in the selected notes.",
  };
}

function AgentAI() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialState = location.state || {};

  const [workspaces, setWorkspaces] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    initialState.workspaceId || ""
  );
  const [selectedNoteIds, setSelectedNoteIds] = useState(() => new Set());
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [insightsByNoteId, setInsightsByNoteId] = useState({});

  const [messages, setMessages] = useState([
    {
      id: 0,
      role: "assistant",
      text:
        "Ask me anything about the notes in this workspace — I'll pull the most relevant passages and answer with citations. You can also pick notes + use a quick prompt for fast insight summaries.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const selectedNotes = useMemo(
    () => notes.filter((note) => selectedNoteIds.has(note.id)),
    [notes, selectedNoteIds]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspacesAndNotes() {
      setLoadingSources(true);
      setSourceError("");
      try {
        const workspaceData = await fetchWorkspaces();
        if (cancelled) return;
        setWorkspaces(workspaceData || []);

        const preferredWorkspaceId =
          initialState.workspaceId || workspaceData?.[0]?.id || "";
        setSelectedWorkspaceId((prev) => prev || preferredWorkspaceId);

        if (preferredWorkspaceId) {
          const noteData = await fetchNotes(preferredWorkspaceId);
          if (cancelled) return;
          setNotes(noteData || []);
        }
      } catch (err) {
        if (!cancelled) {
          setSourceError(err.message || "Failed to load notes");
        }
      } finally {
        if (!cancelled) setLoadingSources(false);
      }
    }
    loadWorkspacesAndNotes();
    return () => {
      cancelled = true;
    };
  }, [initialState.workspaceId]);

  useEffect(() => {
    let cancelled = false;
    async function loadNotesForWorkspace() {
      if (!selectedWorkspaceId) return;
      try {
        const noteData = await fetchNotes(selectedWorkspaceId);
        if (cancelled) return;
        setNotes(noteData || []);
        setSelectedNoteIds((prev) => {
          const validIds = new Set((noteData || []).map((note) => note.id));
          return new Set(Array.from(prev).filter((id) => validIds.has(id)));
        });
      } catch {
        if (!cancelled) setNotes([]);
      }
    }
    loadNotesForWorkspace();
    return () => {
      cancelled = true;
    };
  }, [selectedWorkspaceId]);

  const loadInsightsForSelectedNotes = async () => {
    if (!selectedWorkspaceId || selectedNoteIds.size === 0) return {};
    setLoadingInsights(true);
    const nextInsights = {};
    try {
      await Promise.all(
        Array.from(selectedNoteIds).map(async (noteId) => {
          const data = await fetchNoteInsights(selectedWorkspaceId, noteId);
          nextInsights[noteId] = data;
        })
      );
      setInsightsByNoteId(nextInsights);
      return nextInsights;
    } finally {
      setLoadingInsights(false);
    }
  };

  const sendPrompt = async (text) => {
    const normalized = normalizePrompt(text) || text;
    const userMessage = { id: Date.now(), role: "user", text: normalized };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    try {
      const dataMap =
        Object.keys(insightsByNoteId).length === 0
          ? await loadInsightsForSelectedNotes()
          : insightsByNoteId;
      const response = summarizeFromInsights(
        normalized,
        selectedNotes,
        dataMap
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: response.emptyMessage || "",
          title: response.title,
          items: response.items || [],
          groups: response.groups || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          text: err.message || "I could not load note insights.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const sendChat = async () => {
    const question = inputValue.trim();
    if (!question || sending || !selectedWorkspaceId) return;

    const userMessage = { id: Date.now(), role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setSending(true);

    const priorTurns = [...messages, userMessage]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-9, -1)
      .map((m) => ({ role: m.role, content: m.text || "" }));

    try {
      const data = await chatWithWorkspace(selectedWorkspaceId, {
        question,
        history: priorTurns,
        topK: 6,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: data.answer || "(no answer)",
          sources: data.sources || [],
          tasks: data.tasks || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          text: err.message || "Chat failed.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleInputKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const openSource = (noteId) => {
    if (!noteId || !selectedWorkspaceId) return;
    navigate(`/notes/${selectedWorkspaceId}/note/${noteId}`);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, sending]);

  const reversedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content agentai-content">
          <div className="agentai-chat">
            <div className="agentai-controls">
              <label>
                Workspace
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  disabled={loadingSources}
                >
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="agentai-note-selector" role="group" aria-label="Notes to include">
                {notes.map((note) => {
                  const selected = selectedNoteIds.has(note.id);
                  return (
                    <button
                      key={note.id}
                      type="button"
                      className={`agentai-note-card ${selected ? "is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() =>
                        setSelectedNoteIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(note.id)) next.delete(note.id);
                          else next.add(note.id);
                          return next;
                        })
                      }
                    >
                      <span className="agentai-note-card-icon" aria-hidden>
                        <FileText size={20} strokeWidth={1.75} />
                      </span>
                      <span className="agentai-note-card-title">
                        {note.title || "Untitled"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="agentai-quick-prompts">
                {PROMPT_OPTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendPrompt(prompt)}
                    disabled={sending || selectedNoteIds.size === 0}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {sourceError && <p className="agentai-hint">{sourceError}</p>}
              {loadingInsights && (
                <p className="agentai-hint">Loading note insights…</p>
              )}
            </div>
            <div className="agentai-messages">
              {reversedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`agentai-message agentai-message-${msg.role}`}
                >
                  <div className="agentai-message-col">
                    <div className="agentai-message-bubble">
                      {msg.title && <div className="agentai-section-title">{msg.title}</div>}
                      {msg.items?.length > 0 ? (
                        <ul className="agentai-list">
                          {msg.items.map((item) => (
                            <li key={`${msg.id}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      ) : msg.groups?.length > 0 ? (
                        <div className="agentai-group-list">
                          {msg.groups.map((group) => (
                            <div key={`${msg.id}-${group.noteTitle}`} className="agentai-group">
                              <div className="agentai-group-title">{group.noteTitle}</div>
                              <ul className="agentai-list">
                                {group.items.map((item) => (
                                  <li key={`${msg.id}-${group.noteTitle}-${item}`}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                    {msg.sources?.length > 0 && (
                      <div className="agentai-citations">
                        {msg.sources.map((src) => (
                          <button
                            key={`${msg.id}-${src.span_id}`}
                            type="button"
                            className="agentai-citation-chip"
                            title={src.preview || src.note_title || "source"}
                            onClick={() => openSource(src.note_id)}
                          >
                            <span className="agentai-citation-label">S#</span>
                            <span className="agentai-citation-title">
                              {src.note_title || "note"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.tasks?.length > 0 && (
                      <div className="agentai-citations">
                        {msg.tasks.map((t) => (
                          <span
                            key={`${msg.id}-${t.task_id}`}
                            className="agentai-citation-chip"
                            title={`Status: ${t.status}${t.due_date ? ` · Due ${t.due_date}` : ""}`}
                            style={{
                              borderColor: "rgba(74, 222, 128, 0.55)",
                              background: "rgba(34, 197, 94, 0.18)",
                              color: "#dcfce7",
                            }}
                          >
                            <span
                              className="agentai-citation-label"
                              style={{ color: "#86efac" }}
                            >
                              ✓
                            </span>
                            <span className="agentai-citation-title">
                              {t.title} · {t.status}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="agentai-message agentai-message-assistant">
                  <div className="agentai-message-col">
                    <div className="agentai-message-bubble agentai-message-thinking">
                      Thinking…
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="agentai-input-row">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKey}
                placeholder={
                  selectedWorkspaceId
                    ? "Ask anything about your notes…"
                    : "Select a workspace to start chatting"
                }
                disabled={sending || !selectedWorkspaceId}
                rows={1}
              />
              <button
                type="button"
                className="agentai-send-btn"
                onClick={sendChat}
                disabled={sending || !selectedWorkspaceId || !inputValue.trim()}
                aria-label="Send"
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </div>
            <p className="agentai-hint">
              Mini Agent AI uses current insights data (ideas, contradictions,
              tasks/questions) from selected notes via quick prompts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentAI;
