import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask as deleteTaskApi,
  fetchWorkspaces,
} from "../../api/client";
import "./Calendar.css";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [workspaceId, setWorkspaceId] = useState(
    localStorage.getItem("selected_workspace_id") ||
      localStorage.getItem("workspaceId") ||
      null
  );

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      week.push(currentDay);
    }
    return week;
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateWeek = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + direction * 7);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getWeekForDate = useCallback((date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      week.push(currentDay);
    }
    return week;
  }, []);

  const isSameWeek = useCallback(
    (date1, date2) => {
      const week1 = getWeekForDate(date1);
      const week2 = getWeekForDate(date2);
      return week1[0].toDateString() === week2[0].toDateString();
    },
    [getWeekForDate]
  );

  const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const normalizeTask = (task) => {
    return {
      id: task.id,
      title: task.title,
      date: task.due_date || task.date,
      completed: task.status === "done" || task.completed === true,
      raw: task,
    };
  };

  useEffect(() => {
    async function ensureWorkspace() {
      if (workspaceId) return;

      try {
        const workspaces = await fetchWorkspaces();
        if (workspaces?.length) {
          const firstWorkspaceId = workspaces[0].id;
          setWorkspaceId(firstWorkspaceId);
          localStorage.setItem("selected_workspace_id", firstWorkspaceId);
          setTasksError("");
        } else {
          setTasksError("No workspace found. Please create a workspace first.");
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
        setTasksError(err.message || "Failed to load workspaces");
      }
    }

    ensureWorkspace();
  }, [workspaceId]);

  const loadTasks = useCallback(async () => {
    if (!workspaceId) {
      setTasks([]);
      return;
    }

    try {
      setTasksLoading(true);
      setTasksError("");
      const data = await fetchTasks({ workspaceId });
      setTasks((Array.isArray(data) ? data : []).map(normalizeTask));
    } catch (err) {
      console.error("Failed to load tasks", err);
      setTasksError(err.message || "Failed to load tasks");
    } finally {
      setTasksLoading(false);
    }
  }, [workspaceId]);

  const getTasksForWeek = () => {
    const selectedWeek = getWeekForDate(selectedDate);
    const weekStart = selectedWeek[0];
    const weekEnd = selectedWeek[6];

    return tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    if (view === "month") {
      setView("week");
      setCurrentDate(date);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      setTasksError("Please enter a task title.");
      return;
    }

    if (!workspaceId) {
      setTasksError(
        "No workspace found. Please create or select a workspace first."
      );
      return;
    }

    try {
      setTasksError("");

      await createTask({
        workspace_id: workspaceId,
        title: newTaskTitle.trim(),
        description: null,
        status: "todo",
        due_date: formatDateKey(selectedDate),
        note_id: null,
      });

      setNewTaskTitle("");
      setShowAddTask(false);
      await loadTasks();
    } catch (err) {
      console.error("Failed to create task", err);
      setTasksError(err.message || "Failed to create task");
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await updateTask(taskId, {
        status: task.completed ? "todo" : "done",
      });
      await loadTasks();
    } catch (err) {
      console.error("Failed to update task", err);
      setTasksError(err.message || "Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteTaskApi(taskId);
      await loadTasks();
    } catch (err) {
      console.error("Failed to delete task", err);
      setTasksError(err.message || "Failed to delete task");
    }
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (view === "week") {
      const currentWeek = getWeekForDate(currentDate);
      if (!isSameWeek(currentDate, selectedDate)) {
        setSelectedDate(currentWeek[0]);
      }
    }
  }, [currentDate, view, selectedDate, getWeekForDate, isSameWeek]);

  const weekTasks = getTasksForWeek();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content">
          <div className="calendar-container">
            <div className="calendar-main">
              <div className="calendar-header">
                <div className="calendar-controls">
                  <button
                    onClick={() =>
                      view === "month" ? navigateMonth(-1) : navigateWeek(-1)
                    }
                    className="nav-button"
                  >
                    ←
                  </button>
                  <button onClick={goToToday} className="today-button">
                    Today
                  </button>
                  <button
                    onClick={() =>
                      view === "month" ? navigateMonth(1) : navigateWeek(1)
                    }
                    className="nav-button"
                  >
                    →
                  </button>
                </div>

                <h2 className="calendar-title">
                  {view === "month"
                    ? `${monthNames[month]} ${year}`
                    : (() => {
                        const startMonth = weekDays[0].toLocaleDateString(
                          "en-US",
                          { month: "short" }
                        );
                        const startDay = weekDays[0].getDate();
                        const endMonth = weekDays[6].toLocaleDateString(
                          "en-US",
                          { month: "short" }
                        );
                        const endDay = weekDays[6].getDate();
                        const endYear = weekDays[6].getFullYear();

                        if (startMonth === endMonth) {
                          return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
                        }
                        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
                      })()}
                </h2>

                <div className="view-toggle">
                  <button
                    className={`view-button ${view === "week" ? "active" : ""}`}
                    onClick={() => setView("week")}
                  >
                    Week
                  </button>
                  <button
                    className={`view-button ${
                      view === "month" ? "active" : ""
                    }`}
                    onClick={() => setView("month")}
                  >
                    Month
                  </button>
                </div>
              </div>

              {tasksError && <div className="notes-error">{tasksError}</div>}

              <div className="calendar-grid">
                {view === "month" ? (
                  <>
                    <div className="calendar-weekdays">
                      {dayNames.map((day) => (
                        <div key={day} className="weekday-header">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="calendar-days">
                      {Array.from({ length: startingDayOfWeek }).map(
                        (_, index) => (
                          <div
                            key={`empty-${index}`}
                            className="calendar-day empty"
                          />
                        )
                      )}

                      {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;
                        const dayDate = new Date(year, month, day);
                        const isToday =
                          new Date().getDate() === day &&
                          new Date().getMonth() === month &&
                          new Date().getFullYear() === year;
                        const isSelected =
                          formatDateKey(dayDate) ===
                          formatDateKey(selectedDate);

                        const dayTasks = tasks.filter(
                          (task) => task.date === formatDateKey(dayDate)
                        );

                        return (
                          <div
                            key={day}
                            className={`calendar-day ${
                              isToday ? "today" : ""
                            } ${isSelected ? "selected" : ""}`}
                            onClick={() => handleDayClick(dayDate)}
                          >
                            <span className="day-number">{day}</span>
                            {dayTasks.length > 0 && (
                              <div className="day-tasks-indicator">
                                {dayTasks.length} task
                                {dayTasks.length > 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="calendar-weekdays">
                      {dayNames.map((day) => (
                        <div key={day} className="weekday-header">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="calendar-week">
                      {weekDays.map((day, index) => {
                        const isToday =
                          day.toDateString() === new Date().toDateString();
                        const isSelected =
                          formatDateKey(day) === formatDateKey(selectedDate);

                        const dayTasks = tasks.filter(
                          (task) => task.date === formatDateKey(day)
                        );

                        return (
                          <div
                            key={index}
                            className={`calendar-day week-view ${
                              isToday ? "today" : ""
                            } ${isSelected ? "selected" : ""}`}
                            onClick={() => handleDayClick(day)}
                          >
                            <span className="day-number">{day.getDate()}</span>
                            <div className="day-content">
                              {dayTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={`task-item-day ${
                                    task.completed ? "completed" : ""
                                  }`}
                                >
                                  {task.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="tasks-sidebar">
              <div className="tasks-header">
                <h3 className="tasks-title">Tasks</h3>
                <button
                  className="add-task-button"
                  onClick={() => setShowAddTask(!showAddTask)}
                >
                  {showAddTask ? "−" : "+"}
                </button>
              </div>

              {showAddTask && (
                <div className="add-task-form">
                  <input
                    type="text"
                    className="task-input"
                    placeholder="Enter task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddTask();
                      }
                    }}
                    autoFocus
                  />
                  <div className="task-form-actions">
                    <button
                      className="task-save-button"
                      onClick={handleAddTask}
                    >
                      Add
                    </button>
                    <button
                      className="task-cancel-button"
                      onClick={() => {
                        setShowAddTask(false);
                        setNewTaskTitle("");
                        setTasksError("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="tasks-content">
                {tasksLoading ? (
                  <p className="no-tasks">Loading tasks...</p>
                ) : weekTasks.length === 0 ? (
                  <p className="no-tasks">No tasks this week</p>
                ) : (
                  <div className="tasks-list">
                    {weekTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`task-item ${
                          task.completed ? "completed" : ""
                        }`}
                      >
                        <div className="task-item-content">
                          <input
                            type="checkbox"
                            className="task-checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                          />
                          <span className="task-title">{task.title}</span>
                        </div>
                        <button
                          className="task-delete-button"
                          onClick={() => deleteTask(task.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;