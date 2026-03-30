import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import { fetchNote, updateNote } from "../../api/client";
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
                onChange={(e) => {
                  setTitle(e.target.value);
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteEditorPage;