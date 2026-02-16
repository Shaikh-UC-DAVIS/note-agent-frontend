import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import "./Calendar.css";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // "month" or "week"
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]); // JSON structure: [{ id, title, date, completed }]
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

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

  // Get the week for a given date
  const getWeekForDate = (date) => {
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

  // Check if two dates are in the same week
  const isSameWeek = (date1, date2) => {
    const week1 = getWeekForDate(date1);
    const week2 = getWeekForDate(date2);
    return week1[0].toDateString() === week2[0].toDateString();
  };

  // Format date to YYYY-MM-DD for comparison
  const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Get tasks for the selected week
  const getTasksForWeek = () => {
    const selectedWeek = getWeekForDate(selectedDate);
    const weekStart = selectedWeek[0];
    const weekEnd = selectedWeek[6];

    return tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
  };

  // Handle day click
  const handleDayClick = (date) => {
    setSelectedDate(date);
    // If in month view, switch to week view when clicking a day
    if (view === "month") {
      setView("week");
      setCurrentDate(date);
    }
  };

  // Add new task
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now(),
        title: newTaskTitle.trim(),
        date: formatDateKey(selectedDate),
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      setShowAddTask(false);
    }
  };

  // Toggle task completion
  const toggleTask = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  // Update selected date when navigating weeks
  useEffect(() => {
    if (view === "week") {
      const currentWeek = getWeekForDate(currentDate);
      const selectedWeek = getWeekForDate(selectedDate);

      // If selected date is not in current week, update selected date to first day of current week
      if (!isSameWeek(currentDate, selectedDate)) {
        setSelectedDate(currentWeek[0]);
      }
    }
  }, [currentDate, view]);

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
                        const year = weekDays[6].getFullYear();

                        if (startMonth === endMonth) {
                          return `${startMonth} ${startDay} - ${endDay}, ${year}`;
                        } else {
                          return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
                        }
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
                          ></div>
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
                    onKeyPress={(e) => {
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
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="tasks-content">
                {weekTasks.length === 0 ? (
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
