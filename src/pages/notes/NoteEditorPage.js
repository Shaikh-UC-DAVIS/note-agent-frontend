import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import { fetchNote, fetchNoteInsights, updateNote } from "../../api/client";
import "./Notes.css";

function NoteEditorPage() {
  const navigate = useNavigate();
  const { workspaceId, noteId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | error
  const [fontSize, setFontSize] = useState("medium");
  const [isDefaultUntitled, setIsDefaultUntitled] = useState(false);
  const [notePipelineStatus, setNotePipelineStatus] = useState("created");
  const [insights, setInsights] = useState([]);
  const [objects, setObjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const editorRef = useRef(null);
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const note = await fetchNote(workspaceId, noteId);
        if (cancelled) return;

        const noteTitle = note.title || "";
        const noteBody = note.raw_text || "";

        setTitle(noteTitle);
        setBody(noteBody);
        setIsDefaultUntitled(noteTitle.trim() === "Untitled");
        setNotePipelineStatus(note.status || "created");
        setDirty(false);
        setSaveStatus("saved");
        loadedOnceRef.current = true;
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load note");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, noteId]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (loading) return;

    const currentHtml = editorRef.current.innerHTML;
    if (currentHtml !== body) {
      editorRef.current.innerHTML = body || "";
    }
  }, [body, loading]);

  const loadInsights = async () => {
    try {
      setInsightsLoading(true);
      setInsightsError("");
      const data = await fetchNoteInsights(workspaceId, noteId);
      setObjects(data?.objects || []);
      setLinks(data?.links || []);
      setInsights(data?.insights || []);
      if (data?.note?.status) {
        setNotePipelineStatus(data.note.status);
      }
    } catch (err) {
      setInsightsError(err.message || "Failed to load insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const saveNow = async () => {
    try {
      setSaving(true);
      setSaveStatus("saving");

      const html =
        editorRef.current?.innerHTML != null
          ? editorRef.current.innerHTML
          : body;

      await updateNote(workspaceId, noteId, {
        title,
        raw_text: html,
      });
      setNotePipelineStatus("created");
      setInsights([]);
      setObjects([]);
      setLinks([]);

      setDirty(false);
      setSaveStatus("saved");
    } catch (err) {
      alert(err.message || "Failed to save note");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // Auto-save (debounced) when content changes
  useEffect(() => {
    if (loading) return;
    if (!loadedOnceRef.current) return;
    if (!dirty) return;

    const t = window.setTimeout(() => {
      saveNow();
    }, 700);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, dirty, loading]);

  useEffect(() => {
    let cancelled = false;
    let intervalId;
    const terminalStates = new Set(["ready", "error"]);

    async function pollNoteStatus() {
      try {
        const note = await fetchNote(workspaceId, noteId);
        if (cancelled) return;
        const status = note?.status || "created";
        setNotePipelineStatus(status);
        if (terminalStates.has(status) && intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      } catch {
        // keep current status if polling fails
      }
    }

    pollNoteStatus();
    intervalId = window.setInterval(pollNoteStatus, 3000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [workspaceId, noteId, saveStatus]);

  useEffect(() => {
    if (notePipelineStatus === "ready" || notePipelineStatus === "error") {
      loadInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notePipelineStatus, workspaceId, noteId]);

  const exec = (command, value = null) => {
    if (typeof document === "undefined") return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    document.execCommand(command, false, value);
    editorRef.current && editorRef.current.focus();

    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
      setDirty(true);
    }
  };

  const applyInlineFormat = (type) => {
    if (type === "bold") exec("bold");
    if (type === "italic") exec("italic");
    if (type === "underline") exec("underline");
  };

  const applyListFormat = (ordered = false) => {
    exec(ordered ? "insertOrderedList" : "insertUnorderedList");
  };

  const clearFormatting = () => {
    if (typeof document === "undefined" || !editorRef.current) return;

    editorRef.current.focus();
    const selection = window.getSelection();
    const hasSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed;

    // If no range is selected, clear formatting across the full note body.
    if (!hasSelection) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    document.execCommand("removeFormat", false, null);
    document.execCommand("unlink", false, null);

    // removeFormat can leave behind inline styles/highlights from pasted content.
    const root = editorRef.current;
    const styledNodes = root.querySelectorAll("[style], [class], mark, font, span");
    styledNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.removeAttribute("style");
      node.removeAttribute("class");
      node.removeAttribute("data-highlight");

      // Normalize presentation-only wrappers after stripping attributes.
      const tag = node.tagName.toLowerCase();
      if ((tag === "mark" || tag === "font" || tag === "span") && node.attributes.length === 0) {
        const parent = node.parentNode;
        if (!parent) return;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
      }
    });

    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
      setDirty(true);
    }
  };

  const pipelineSteps = [
    "created",
    "chunked",
    "embedded",
    "structured",
    "ready",
  ];

  const getStepState = (step) => {
    if (notePipelineStatus === "error") return "pending";
    const currentIdx = pipelineSteps.indexOf(notePipelineStatus);
    const stepIdx = pipelineSteps.indexOf(step);
    if (currentIdx === -1) return "pending";
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  const getProgressPercent = () => {
    if (notePipelineStatus === "ready") return 100;
    if (notePipelineStatus === "error") return 100;
    const idx = pipelineSteps.indexOf(notePipelineStatus);
    if (idx <= 0) return 8;
    return Math.round((idx / (pipelineSteps.length - 1)) * 100);
  };

  const isProcessing =
    notePipelineStatus !== "ready" && notePipelineStatus !== "error";

  const keyTakeaways = objects
    .filter((obj) => obj.type !== "Question")
    .slice(0, 5);

  const openQuestions = objects
    .filter((obj) => obj.type === "Question")
    .slice(0, 5);

  const objectTextById = new Map(
    objects.map((obj) => [String(obj.id), obj.canonical_text || ""])
  );

  const potentialConflicts = links
    .filter((link) => link.type === "Contradicts")
    .map((link) => {
      const source = objectTextById.get(String(link.src_object_id)) || "Statement A";
      const target = objectTextById.get(String(link.dst_object_id)) || "Statement B";
      return `${source} vs ${target}`;
    })
    .filter((text, index, arr) => arr.indexOf(text) === index)
    .slice(0, 4);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="note-editor-page">
          <div className="note-editor-header">
            <button
              type="button"
              className="notes-back-button"
              onClick={async () => {
                if (dirty && !saving) {
                  await saveNow();
                }
                navigate("/notes", { state: { workspaceId } });
              }}
            >
              ← Notes
            </button>

            <div className="note-editor-header-right">
              <span className="note-editor-save-indicator">
                {saveStatus === "saving"
                  ? "Saving…"
                  : saveStatus === "error"
                  ? "Not saved"
                  : dirty
                  ? "Unsaved"
                  : "Saved"}
              </span>
            </div>
          </div>

          {error && <div className="notes-error">{error}</div>}

          {loading ? (
            <div className="notes-loading">Loading note…</div>
          ) : (
            <div className="note-editor-main">
              <input
                type="text"
                className="notes-editor-title"
                placeholder="Title"
                value={title}
                onFocus={(e) => {
                  if (isDefaultUntitled && title.trim() === "Untitled") {
                    // Select the placeholder-like default title so first typing replaces it.
                    e.target.select();
                  }
                }}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (isDefaultUntitled) {
                    setIsDefaultUntitled(false);
                  }
                  setDirty(true);
                }}
              />

              <div className="notes-editor-toolbar">
                <div className="notes-editor-toolbar-group">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyInlineFormat("bold");
                    }}
                  >
                    B
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyInlineFormat("italic");
                    }}
                  >
                    I
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyInlineFormat("underline");
                    }}
                  >
                    U
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyListFormat(false);
                    }}
                  >
                    • List
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyListFormat(true);
                    }}
                  >
                    1. List
                  </button>
                </div>

                <div className="notes-editor-toolbar-group">
                  <label className="notes-editor-fontsize-label">
                    Text size
                    <select
                      className="notes-editor-fontsize-select"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearFormatting();
                    }}
                  >
                    Clear formatting
                  </button>
                </div>
              </div>

              <div
                ref={editorRef}
                className="notes-editor-body"
                placeholder="Start typing your note…"
                contentEditable
                suppressContentEditableWarning
                style={{
                  fontSize:
                    fontSize === "small"
                      ? 13
                      : fontSize === "large"
                      ? 16
                      : 14,
                  direction: "ltr",
                  textAlign: "left",
                  unicodeBidi: "plaintext",
                }}
                onInput={() => {
                  if (editorRef.current) {
                    setBody(editorRef.current.innerHTML);
                    setDirty(true);
                  }
                }}
              />

              <div className="note-ml-panel">
                <div className="note-ml-header">
                  <h3>Insights</h3>
                  <span className={`note-ml-status note-ml-status-${notePipelineStatus}`}>
                    {notePipelineStatus}
                  </span>
                </div>

                <div className="note-ml-steps" aria-label="Processing steps">
                  {pipelineSteps.map((step) => {
                    const state = getStepState(step);
                    return (
                      <div
                        key={step}
                        className={`note-ml-step note-ml-step-${state}`}
                      >
                        <span className="note-ml-step-dot" />
                        <span className="note-ml-step-label">{step}</span>
                      </div>
                    );
                  })}
                  {notePipelineStatus === "error" && (
                    <div className="note-ml-step note-ml-step-error">
                      <span className="note-ml-step-dot" />
                      <span className="note-ml-step-label">error</span>
                    </div>
                  )}
                </div>

                <div className="note-ml-progress-wrap" aria-label="Processing progress">
                  <div className="note-ml-progress-track">
                    <div
                      className={`note-ml-progress-fill ${
                        isProcessing ? "is-processing" : ""
                      } ${notePipelineStatus === "error" ? "is-error" : ""}`}
                      style={{ width: `${getProgressPercent()}%` }}
                    />
                  </div>
                  <span className="note-ml-progress-text">
                    {isProcessing
                      ? "Processing..."
                      : notePipelineStatus === "error"
                      ? "Failed"
                      : "Complete"}
                  </span>
                </div>

                {insightsLoading && (
                  <div className="notes-loading">Loading insights…</div>
                )}
                {insightsError && (
                  <div className="notes-error">{insightsError}</div>
                )}

                {!insightsLoading && !insightsError && (
                  <div className="note-ml-content">
                    <div className="note-ml-column">
                      <h4>Key Takeaways</h4>
                      {keyTakeaways.length === 0 ? (
                        <p className="note-ml-empty">No key takeaways yet.</p>
                      ) : (
                        keyTakeaways.map((obj) => (
                          <div key={obj.id} className="note-ml-item">
                            {obj.canonical_text}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="note-ml-column">
                      <h4>Potential Conflicts</h4>
                      {potentialConflicts.length === 0 ? (
                        <p className="note-ml-empty">No conflicts detected.</p>
                      ) : (
                        potentialConflicts.map((conflictText) => (
                          <div key={conflictText} className="note-ml-item">
                            {conflictText}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="note-ml-column">
                      <h4>Open Questions</h4>
                      {openQuestions.length === 0 ? (
                        <p className="note-ml-empty">No open questions found.</p>
                      ) : (
                        openQuestions.map((question) => (
                          <div key={question.id} className="note-ml-item">
                            {question.canonical_text}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteEditorPage;