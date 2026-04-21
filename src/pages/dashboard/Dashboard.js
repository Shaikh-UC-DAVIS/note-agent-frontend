import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import DashboardHeader from '../../components/dashboard-header/DashboardHeader';
import { fetchNoteInsights, fetchNotes, fetchTasks, fetchWorkspaces } from '../../api/client';
import './Dashboard.css';

function startOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 Sunday .. 6 Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function endOfCurrentWeek() {
  const monday = startOfCurrentWeek();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function toDateParam(date) {
  return date.toISOString().slice(0, 10);
}

function Dashboard() {
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [summaryGroups, setSummaryGroups] = useState([]);
  const [weeklyNotesCount, setWeeklyNotesCount] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');
  const [weeklyTasks, setWeeklyTasks] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWeeklySummary() {
      setSummaryLoading(true);
      setSummaryError('');
      try {
        const weekStart = startOfCurrentWeek();
        const workspaces = await fetchWorkspaces();
        if (cancelled) return;

        const noteBuckets = await Promise.all(
          (workspaces || []).map(async (ws) => {
            const notes = await fetchNotes(ws.id, { offset: 0, limit: 200 });
            return { workspaceId: ws.id, notes: notes || [] };
          })
        );
        if (cancelled) return;

        const weeklyNotes = noteBuckets.flatMap((bucket) =>
          bucket.notes
            .filter((note) => {
              const createdAt = note?.created_at ? new Date(note.created_at) : null;
              return createdAt && createdAt >= weekStart;
            })
            .map((note) => ({ ...note, workspaceId: bucket.workspaceId }))
        );
        setWeeklyNotesCount(weeklyNotes.length);

        const groups = await Promise.all(
          weeklyNotes.map(async (note) => {
            let highlights = [];
            try {
              const data = await fetchNoteInsights(note.workspaceId, note.id);
              const objects = data?.objects || [];
              const keyItems = objects
                .filter((obj) =>
                  ['Idea', 'Claim', 'Definition', 'Task', 'Question'].includes(obj.type)
                )
                .slice(0, 4)
                .map((obj) => obj.canonical_text)
                .filter(Boolean);
              highlights = keyItems;
            } catch {
              // Keep summary resilient if one note insights call fails.
            }

            if (!highlights.length && note.raw_text) {
              const plainText = String(note.raw_text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              if (plainText) {
                highlights = [plainText.slice(0, 180) + (plainText.length > 180 ? '...' : '')];
              }
            }

            return {
              id: note.id,
              title: note.title || 'Untitled',
              highlights: highlights.slice(0, 4),
            };
          })
        );
        if (cancelled) return;
        setSummaryGroups(groups.filter((group) => group.highlights.length > 0));
      } catch (err) {
        if (!cancelled) {
          setSummaryError(err.message || 'Failed to load weekly summary');
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }

    loadWeeklySummary();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeeklyTasks() {
      setTasksLoading(true);
      setTasksError('');
      try {
        const startDate = toDateParam(startOfCurrentWeek());
        const endDate = toDateParam(endOfCurrentWeek());
        const tasks = await fetchTasks({ startDate, endDate });
        if (cancelled) return;
        setWeeklyTasks(tasks || []);
      } catch (err) {
        if (!cancelled) {
          setTasksError(err.message || 'Failed to load weekly tasks');
        }
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    }

    loadWeeklyTasks();
    return () => {
      cancelled = true;
    };
  }, []);

  const summarySubtitle = useMemo(() => {
    if (weeklyNotesCount === 0) return 'No notes created this week';
    return `${weeklyNotesCount} note${weeklyNotesCount === 1 ? '' : 's'} created this week`;
  }, [weeklyNotesCount]);

  const tasksSubtitle = useMemo(() => {
    if (weeklyTasks.length === 0) return 'No tasks due this week';
    return `${weeklyTasks.length} task${weeklyTasks.length === 1 ? '' : 's'} due this week`;
  }, [weeklyTasks]);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content">
          {/* Weekly Summary Section */}
          <section className="content-section">
            <h2 className="section-title">Weekly Summary</h2>
            <p className="section-subtitle">{summarySubtitle}</p>
            {summaryLoading ? (
              <p className="empty-state">Loading weekly summary...</p>
            ) : summaryError ? (
              <p className="empty-state">{summaryError}</p>
            ) : summaryGroups.length === 0 ? (
              <p className="empty-state">No Summary this week</p>
            ) : (
              <div className="section-content scrollable">
                <div className="weekly-summary-list">
                  {summaryGroups.map((group) => (
                    <div key={group.id} className="weekly-summary-note">
                      <h3 className="weekly-summary-note-title">{group.title}</h3>
                      <ul className="weekly-summary-bullets">
                        {group.highlights.map((item) => (
                          <li key={`${group.id}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Task Review Section */}
          <section className="content-section">
            <h2 className="section-title">Task Review</h2>
            <p className="section-subtitle">{tasksSubtitle}</p>
            {tasksLoading ? (
              <p className="empty-state">Loading weekly tasks...</p>
            ) : tasksError ? (
              <p className="empty-state">{tasksError}</p>
            ) : weeklyTasks.length === 0 ? (
              <p className="empty-state">No Tasks this week</p>
            ) : (
              <div className="section-content scrollable">
                <div className="weekly-task-list">
                  {weeklyTasks.map((task) => (
                    <div key={task.id} className="weekly-task-item">
                      <div className="weekly-task-title">{task.title || 'Untitled task'}</div>
                      <div className="weekly-task-meta">
                        <span className="weekly-task-chip">{task.status || 'todo'}</span>
                        {task.due_date ? (
                          <span>Due {task.due_date}</span>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
