import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { fetchNotes, fetchWorkspaces } from '../../api/client';
import './DashboardHeader.css';

const DashboardHeader = ({
  searchValue = '',
  onSearchChange,
  searchSuggestions = [],
  onSuggestionSelect,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [allNotes, setAllNotes] = useState([]);

  const renderHighlightedText = (text, query) => {
    if (!text) return null;
    const rawQuery = (query || '').trim();
    if (!rawQuery) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = rawQuery.toLowerCase();
    const chunks = [];
    let cursor = 0;
    let key = 0;

    while (cursor < text.length) {
      const matchIndex = lowerText.indexOf(lowerQuery, cursor);
      if (matchIndex === -1) {
        chunks.push(<span key={`plain-${key++}`}>{text.slice(cursor)}</span>);
        break;
      }
      if (matchIndex > cursor) {
        chunks.push(
          <span key={`plain-${key++}`}>{text.slice(cursor, matchIndex)}</span>
        );
      }
      chunks.push(
        <mark key={`mark-${key++}`} className="search-match-highlight">
          {text.slice(matchIndex, matchIndex + rawQuery.length)}
        </mark>
      );
      cursor = matchIndex + rawQuery.length;
    }

    return chunks;
  };
  
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'Home';
    if (path === '/agentAI') return 'Agent AI';
    if (path === '/notes') return 'Notes';
    if (path === '/calendar') return 'Calendar';
    if (path === '/settings') return 'Settings';
    return 'Home';
  };

  const isNotesPage = location.pathname === '/notes';
  const isSearchControlled = typeof onSearchChange === 'function';
  const effectiveSearchValue = isSearchControlled ? searchValue : localSearchValue;
  const normalizedQuery = effectiveSearchValue.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    async function loadAllNotes() {
      try {
        const workspaces = await fetchWorkspaces();
        if (cancelled) return;
        const noteBuckets = await Promise.all(
          (workspaces || []).map(async (workspace) => {
            const notes = await fetchNotes(workspace.id, { offset: 0, limit: 200 });
            return (notes || []).map((note) => ({
              ...note,
              workspaceId: workspace.id,
              workspaceName: workspace.name || 'Workspace',
            }));
          })
        );
        if (!cancelled) {
          setAllNotes(noteBuckets.flat());
        }
      } catch {
        if (!cancelled) setAllNotes([]);
      }
    }
    loadAllNotes();
    return () => {
      cancelled = true;
    };
  }, []);

  const globalSuggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return allNotes
      .map((note) => {
        const title = note.title || 'Untitled';
        const bodyText = (note.raw_text || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const titleLower = title.toLowerCase();
        const bodyLower = bodyText.toLowerCase();
        if (!titleLower.includes(normalizedQuery) && !bodyLower.includes(normalizedQuery)) {
          return null;
        }
        let preview = '';
        const bodyIdx = bodyLower.indexOf(normalizedQuery);
        if (bodyIdx >= 0) {
          const start = Math.max(0, bodyIdx - 35);
          const end = Math.min(bodyText.length, bodyIdx + normalizedQuery.length + 55);
          preview = `${start > 0 ? '...' : ''}${bodyText.slice(start, end)}${end < bodyText.length ? '...' : ''}`;
        }
        return {
          id: `${note.workspaceId}:${note.id}`,
          title,
          preview,
          note,
        };
      })
      .filter(Boolean)
      .slice(0, 8);
  }, [allNotes, normalizedQuery]);

  const activeSuggestions = searchSuggestions.length > 0 ? searchSuggestions : globalSuggestions;
  const canShowSuggestions =
    showSuggestions &&
    effectiveSearchValue.trim().length > 0 &&
    activeSuggestions.length > 0;

  const applySearchValue = (value) => {
    if (isSearchControlled) {
      onSearchChange(value);
    } else {
      setLocalSearchValue(value);
    }
  };

  const handleSubmitSearch = () => {
    const query = (effectiveSearchValue || '').trim();
    if (!query) return;
    if (!isNotesPage) {
      navigate('/notes', { state: { searchQuery: query } });
    }
  };

  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="breadcrumb-container">
          <div className="breadcrumb">{getBreadcrumb()}</div>
          {isNotesPage && (
            <div className="filepath">All Notes</div>
          )}
        </div>
        <div className="search-container">
          <input 
            type="text" 
            placeholder={isNotesPage ? "Search notes (title or content)" : "Search"} 
            className="search-input"
            value={effectiveSearchValue}
            onChange={(e) => applySearchValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              window.setTimeout(() => setShowSuggestions(false), 120);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmitSearch();
              }
            }}
          />
          <Search size={18} className="search-icon" />
          {canShowSuggestions && (
            <div className="search-suggestions">
              {activeSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="search-suggestion-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (typeof onSuggestionSelect === 'function') {
                      onSuggestionSelect(suggestion);
                    } else if (suggestion.note?.workspaceId && suggestion.note?.id) {
                      navigate(`/notes/${suggestion.note.workspaceId}/note/${suggestion.note.id}`);
                    } else {
                      applySearchValue(suggestion.title || '');
                    }
                  }}
                >
                  <div className="search-suggestion-title">
                    {renderHighlightedText(suggestion.title, effectiveSearchValue)}
                  </div>
                  {suggestion.preview && (
                    <div className="search-suggestion-preview">
                      {renderHighlightedText(suggestion.preview, effectiveSearchValue)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

