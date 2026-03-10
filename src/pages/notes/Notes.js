import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import { FolderOpen, FileText } from "lucide-react";
import {
  fetchWorkspaces,
  createWorkspace,
  fetchNotes,
  createNote,
  deleteNote,
} from "../../api/client";
import "./Notes.css";

function Notes() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationWorkspaceId = location.state?.workspaceId || null;
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspacesError, setWorkspacesError] = useState("");

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    locationWorkspaceId
  );
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [showNewWorkspaceInput, setShowNewWorkspaceInput] = useState(false);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");

  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState(() => new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    let cancelled = false;
    async function loadWorkspaces() {
      setWorkspacesLoading(true);
      setWorkspacesError("");
      try {
        const data = await fetchWorkspaces();
        if (cancelled) return;
        setWorkspaces(data || []);
      } catch (err) {
        if (cancelled) return;
        setWorkspacesError(err.message || "Failed to load workspaces");
      } finally {
        if (!cancelled) {
          setWorkspacesLoading(false);
        }
      }
    }
    loadWorkspaces();
    return () => {
      cancelled = true;
    };
  }, []);

  // Respond to workspace selection coming from navigation state
  useEffect(() => {
    if (locationWorkspaceId) {
      setSelectedWorkspaceId(locationWorkspaceId);
      setSelectedNoteId(null);
      setSelectedNoteIds(new Set());
      setSelectionMode(false);
    } else if (!locationWorkspaceId && !selectedWorkspaceId) {
      // ensure we are in workspace grid view when no workspace is selected
      setSelectedNoteIds(new Set());
      setSelectionMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationWorkspaceId]);

  // Load notes when workspace changes
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setNotes([]);
      setSelectedNoteId(null);
      setSelectedNoteIds(new Set());
      setSelectionMode(false);
      return;
    }
    let cancelled = false;
    async function loadNotes() {
      setNotesLoading(true);
      setNotesError("");
      try {
        const data = await fetchNotes(selectedWorkspaceId);
        if (cancelled) return;
        setNotes(data || []);
        setSelectedNoteId(null);
        setSelectedNoteIds(new Set());
        setSelectionMode(false);
      } catch (err) {
        if (cancelled) return;
        setNotesError(err.message || "Failed to load notes");
      } finally {
        if (!cancelled) {
          setNotesLoading(false);
        }
      }
    }
    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [selectedWorkspaceId]);

  const handleCreateWorkspace = async () => {
    const name = newWorkspaceName.trim();
    if (!name) return;
    try {
      setCreatingWorkspace(true);
      const ws = await createWorkspace(name);
      setWorkspaces((prev) => [...prev, ws]);
      setNewWorkspaceName("");
      setShowNewWorkspaceInput(false);
      setSelectedWorkspaceId(ws.id);
    } catch (err) {
      alert(err.message || "Failed to create workspace");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleSelectWorkspace = (id) => {
    setSelectedWorkspaceId(id);
    setSelectedNoteId(null);
    setSelectedNoteIds(new Set());
    setSelectionMode(false);
  };

  const handleSelectNote = (note) => {
    if (selectionMode) {
      toggleNoteSelected(note.id);
      return;
    }
    setSelectedNoteId(note.id);
    navigate(`/notes/${selectedWorkspaceId}/note/${note.id}`);
  };

  const handleCreateNote = async () => {
    if (!selectedWorkspaceId) return;
    try {
      const note = await createNote(selectedWorkspaceId, {
        title: "Untitled",
        raw_text: "",
      });
      setNotes((prev) => [note, ...prev]);
      setSelectedNoteId(note.id);
      navigate(`/notes/${selectedWorkspaceId}/note/${note.id}`);
    } catch (err) {
      alert(err.message || "Failed to create note");
    }
  };

  const toggleNoteSelected = (id) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelectedNotes = async () => {
    if (!selectedWorkspaceId) return;
    const ids = Array.from(selectedNoteIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} note(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => deleteNote(selectedWorkspaceId, id)));
      setNotes((prev) => prev.filter((n) => !selectedNoteIds.has(n.id)));
      setSelectedNoteIds(new Set());
      setSelectionMode(false);
    } catch (err) {
      alert(err.message || "Failed to delete selected notes");
    }
  };

  const handleSelectAllNotes = () => {
    setSelectedNoteIds(new Set(notes.map((n) => n.id)));
  };

  const handleClearSelectedNotes = () => {
    setSelectedNoteIds(new Set());
  };

  const isWorkspaceView = !selectedWorkspaceId;
  const currentWorkspace = workspaces.find(
    (ws) => ws.id === selectedWorkspaceId
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content">
          <div className="notes-header-row">
            <div className="notes-header-left">
              {!isWorkspaceView && (
                <button
                  type="button"
                  className="notes-back-button"
                  onClick={() => {
                    setSelectedWorkspaceId(null);
                    setSelectedNoteId(null);
                    setNotes([]);
                  }}
                >
                  ← Workspaces
                </button>
              )}
              <h2 className="notes-main-title">
                {isWorkspaceView
                  ? "Workspaces"
                  : currentWorkspace?.name || "Workspace"}
              </h2>
              <p className="notes-main-subtitle">
                {isWorkspaceView
                  ? "Organize your notes into workspaces."
                  : "Notes in this workspace."}
              </p>
            </div>
            <div className="notes-main-actions">
              {isWorkspaceView ? (
                <button
                  type="button"
                  onClick={() =>
                    setShowNewWorkspaceInput((prev) => !prev)
                  }
                >
                  + Workspace
                </button>
              ) : (
                <div className="notes-actions-row">
                  {selectionMode ? (
                    <>
                      <button
                        type="button"
                        className="notes-btn-secondary"
                        onClick={handleDeleteSelectedNotes}
                        disabled={selectedNoteIds.size === 0}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="notes-btn-secondary"
                        onClick={
                          selectedNoteIds.size === notes.length && notes.length > 0
                            ? handleClearSelectedNotes
                            : handleSelectAllNotes
                        }
                        disabled={notes.length === 0}
                      >
                        {selectedNoteIds.size === notes.length && notes.length > 0
                          ? "Clear"
                          : "Select all"}
                      </button>
                      <button
                        type="button"
                        className="notes-btn-secondary"
                        onClick={() => {
                          setSelectionMode(false);
                          setSelectedNoteIds(new Set());
                        }}
                      >
                        Done
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="notes-btn-secondary"
                      onClick={() => setSelectionMode(true)}
                      disabled={notes.length === 0}
                    >
                      Select
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    disabled={!selectedWorkspaceId}
                  >
                    + Note
                  </button>
                </div>
              )}
            </div>
          </div>

          {workspacesError && (
            <div className="notes-error">{workspacesError}</div>
          )}
          {notesError && !isWorkspaceView && (
            <div className="notes-error">{notesError}</div>
          )}

          {showNewWorkspaceInput && (
            <div className="notes-add-workspace-row">
              <input
                type="text"
                placeholder="New workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateWorkspace();
                }}
              />
              <button
                type="button"
                onClick={handleCreateWorkspace}
                disabled={creatingWorkspace}
              >
                {creatingWorkspace ? "Adding…" : "Add"}
              </button>
            </div>
          )}

          <div className="notes-grid">
            {isWorkspaceView ? (
              workspacesLoading ? (
                <div className="notes-loading">Loading workspaces…</div>
              ) : workspaces.length === 0 ? (
                <div className="notes-empty">
                  No workspaces yet. Use “+ Workspace” to create one.
                </div>
              ) : (
                workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="notes-card"
                    onClick={() => handleSelectWorkspace(ws.id)}
                  >
                    <div className="notes-card-icon">
                      <FolderOpen size={22} />
                    </div>
                    <div className="notes-card-text">
                      <div className="notes-card-title">{ws.name}</div>
                      <div className="notes-card-subtitle">
                        Workspace
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : notesLoading ? (
              <div className="notes-loading">Loading notes…</div>
            ) : notes.length === 0 ? (
              <div className="notes-empty">
                No notes in this workspace yet. Use “+ Note” to create one.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`notes-card ${
                    (!selectionMode && note.id === selectedNoteId) ? "notes-card-active" : ""
                  }`}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="notes-card-icon">
                    <FileText size={22} />
                  </div>
                  <div className="notes-card-text">
                    <div className="notes-card-title">
                      {note.title || "Untitled"}
                    </div>
                    <div className="notes-card-subtitle">Note</div>
                  </div>
                  {selectionMode && (
                    <label
                      className="notes-card-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNoteIds.has(note.id)}
                        onChange={() => toggleNoteSelected(note.id)}
                      />
                    </label>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notes;
