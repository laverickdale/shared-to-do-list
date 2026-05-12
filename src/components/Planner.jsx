import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Plus
} from "lucide-react";
import { getDaysLeft, formatDate, classNames } from "../lib/taskUtils.js";

const ownerColors = {
  Dale: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", pill: "bg-sky-100 text-sky-700" },
  Mick: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", pill: "bg-amber-100 text-amber-700" },
  Mark: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", pill: "bg-green-100 text-green-700" },
  Unassigned: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", pill: "bg-slate-100 text-slate-700" }
};

function PlannerDetailPanel({ task, onClose, onEdit, onStatusChange, isVisible }) {
  if (!task || !isVisible) return null;

  const statusOptions = ["To Do", "In Progress", "Done"];
  const currentOwnerColor = ownerColors[task.owner] || ownerColors.Unassigned;
  const daysLeft = getDaysLeft(task.due_date);
  const isOverdue = task.status !== "Done" && daysLeft !== null && daysLeft < 0;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl sm:relative sm:max-w-none sm:border-l sm:shadow-none"
    >
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Task Details</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 p-6">
        {/* Title */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{task.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {task.status === "Done" ? "Completed" : isOverdue ? "Overdue" : "Active"}
          </p>
        </div>

        {/* Owner */}
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Owner</p>
          <div className="mt-2 flex items-center gap-2">
            <div className={classNames("h-3 w-3 rounded-full", currentOwnerColor.pill.split(" ")[0])}></div>
            <span className="font-medium text-slate-900">{task.owner}</span>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Status</p>
          <div className="mt-2 flex gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(task.id, status)}
                className={classNames(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  task.status === status
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Due Date</p>
            <p className="mt-2 text-sm text-slate-900">{formatDate(task.due_date)}</p>
          </div>
        )}

        {/* Time */}
        {(task.start_time || task.end_time) && !task.all_day && (
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Time</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-900">
              <Clock className="h-4 w-4" />
              {task.start_time && <span>{task.start_time}</span>}
              {task.start_time && task.end_time && <span>–</span>}
              {task.end_time && <span>{task.end_time}</span>}
            </div>
          </div>
        )}

        {/* Location */}
        {task.location && (
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Location</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-900">
              <MapPin className="h-4 w-4" />
              {task.location}
            </div>
          </div>
        )}

        {/* Priority */}
        {task.priority && (
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Priority</p>
            <p className="mt-2 text-sm text-slate-900">{task.priority}</p>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Notes</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{task.notes}</p>
          </div>
        )}

        {/* Edit Button */}
        <button
          onClick={() => onEdit(task)}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Edit Task
        </button>
      </div>
    </motion.div>
  );
}

function MiniCalendar({ selectedDate, onDateSelect }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = [];
  const firstDay = getFirstDayOfMonth(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isSelected = (day) => {
    if (!day) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth.getMonth() &&
      selectedDate.getFullYear() === viewMonth.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="rounded p-1 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded p-1 hover:bg-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-xs font-medium text-slate-500 py-1">
            {day}
          </div>
        ))}
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (day) {
                const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
                onDateSelect(newDate);
              }
            }}
            className={classNames(
              "rounded py-1 text-xs font-medium",
              day === null
                ? ""
                : isSelected(day)
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
            )}
          >
            {day}
          </button>
        ))}
      </div>

      <button
        onClick={() => onDateSelect(new Date())}
        className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Today
      </button>
    </div>
  );
}

function WeekView({ tasks, selectedDate, onTaskClick, onNewTask }) {
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(new Date(selectedDate));
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }

  const tasksByDate = {};
  weekDays.forEach((date) => {
    const key = date.toISOString().split("T")[0];
    tasksByDate[key] = tasks.filter(
      (task) => task.due_date === key && task.show_on_calendar !== false
    );
  });

  const unscheduledTasks = tasks.filter(
    (task) => !task.due_date && task.show_on_calendar !== false
  );

  return (
    <div className="space-y-4">
      {/* Week Grid */}
      <div className="space-y-2">
        {weekDays.map((date) => {
          const key = date.toISOString().split("T")[0];
          const dayTasks = tasksByDate[key] || [];
          const isToday =
            date.toDateString() === new Date().toDateString();

          return (
            <div key={key} className={classNames(
              "rounded-xl border-2 p-4",
              isToday
                ? "border-sky-200 bg-sky-50"
                : "border-slate-200 bg-white"
            )}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className="text-lg font-bold text-slate-900">{date.getDate()}</p>
                </div>
                <button
                  onClick={onNewTask}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              {dayTasks.length > 0 ? (
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <motion.button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="w-full text-left"
                      layout
                    >
                      <div className="rounded-lg border border-slate-200 bg-white p-3 hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {task.title}
                            </p>
                            {task.start_time && (
                              <p className="mt-1 text-xs text-slate-500">
                                {task.start_time}
                              </p>
                            )}
                          </div>
                          <div
                            className={classNames(
                              "h-2 w-2 rounded-full flex-shrink-0 mt-1",
                              task.owner === "Dale"
                                ? "bg-sky-500"
                                : task.owner === "Mick"
                                  ? "bg-amber-500"
                                  : task.owner === "Mark"
                                    ? "bg-green-500"
                                    : "bg-slate-400"
                            )}
                          ></div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No tasks</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Unscheduled Tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-orange-900">
            To Schedule ({unscheduledTasks.length})
          </h3>
          <div className="space-y-2">
            {unscheduledTasks.map((task) => (
              <motion.button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="w-full text-left"
                layout
              >
                <div className="rounded-lg border border-orange-200 bg-white p-3 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {task.title}
                      </p>
                    </div>
                    <div
                      className={classNames(
                        "h-2 w-2 rounded-full flex-shrink-0 mt-1",
                        task.owner === "Dale"
                          ? "bg-sky-500"
                          : task.owner === "Mick"
                            ? "bg-amber-500"
                            : task.owner === "Mark"
                              ? "bg-green-500"
                              : "bg-slate-400"
                      )}
                    ></div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TodayView({ tasks, onTaskClick, onStatusChange, onNewTask }) {
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(
    (task) => task.due_date === today && task.show_on_calendar !== false
  );
  const overdueTasks = tasks.filter(
    (task) =>
      task.status !== "Done" &&
      task.due_date &&
      task.due_date < today &&
      task.show_on_calendar !== false
  );

  return (
    <div className="space-y-6">
      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            Overdue ({overdueTasks.length})
          </h3>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <motion.button
                key={task.id}
                onClick={() => onTaskClick(task)}
                layout
                className="w-full"
              >
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-left hover:shadow-md transition">
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Due: {formatDate(task.due_date)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Today</h3>
        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <motion.button
                key={task.id}
                onClick={() => onTaskClick(task)}
                layout
                className="w-full"
              >
                <div className="rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      {task.start_time && (
                        <p className="mt-1 text-xs text-slate-500">
                          {task.start_time}
                        </p>
                      )}
                    </div>
                    <div
                      className={classNames(
                        "h-3 w-3 rounded-full flex-shrink-0 mt-1",
                        task.owner === "Dale"
                          ? "bg-sky-500"
                          : task.owner === "Mick"
                            ? "bg-amber-500"
                            : task.owner === "Mark"
                              ? "bg-green-500"
                              : "bg-slate-400"
                      )}
                    ></div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Nothing due today</p>
            <button
              onClick={onNewTask}
              className="mt-3 text-sm font-medium text-slate-900 hover:text-slate-700"
            >
              + Add a task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Planner({
  tasks,
  selectedDate,
  onDateSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onNewTask
}) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState("week"); // "today", "week", "agenda", "month"

  return (
    <div className="min-h-screen bg-slate-100 pb-24 sm:pb-0">
      <div className="grid h-screen grid-cols-1 gap-0 sm:grid-cols-[300px_1fr_380px]">
        {/* Left Sidebar - Desktop only */}
        <div className="hidden border-r border-slate-200 bg-white p-6 overflow-y-auto sm:block">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Planner</h2>
            <p className="mt-1 text-xs text-slate-500">Select a date to view</p>
          </div>

          <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />

          {/* View selector */}
          <div className="mt-6 space-y-2">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "agenda", label: "Agenda" },
              { id: "month", label: "Month" }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={classNames(
                  "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition text-left",
                  view === v.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center - Main Planner Canvas */}
        <div className="overflow-y-auto bg-slate-50 p-4 sm:p-8">
          {/* Mobile view selector */}
          <div className="mb-6 flex gap-2 sm:hidden overflow-x-auto">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "Week" },
              { id: "agenda", label: "Agenda" }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={classNames(
                  "rounded-lg px-4 py-2 text-xs font-medium transition whitespace-nowrap",
                  view === v.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-4xl">
            {view === "today" && (
              <TodayView
                tasks={tasks}
                onTaskClick={setSelectedTask}
                onStatusChange={onStatusChange}
                onNewTask={onNewTask}
              />
            )}
            {view === "week" && (
              <WeekView
                tasks={tasks}
                selectedDate={selectedDate}
                onTaskClick={setSelectedTask}
                onNewTask={onNewTask}
              />
            )}
            {view === "agenda" && (
              <div className="space-y-2">
                {tasks
                  .filter((task) => task.show_on_calendar !== false)
                  .sort((a, b) =>
                    (a.due_date || "9999-12-31").localeCompare(
                      b.due_date || "9999-12-31"
                    )
                  )
                  .map((task) => (
                    <motion.button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      layout
                      className="w-full text-left"
                    >
                      <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {task.due_date
                                ? formatDate(task.due_date)
                                : "No date"}
                            </p>
                          </div>
                          <div
                            className={classNames(
                              "h-3 w-3 rounded-full flex-shrink-0 mt-1",
                              task.owner === "Dale"
                                ? "bg-sky-500"
                                : task.owner === "Mick"
                                  ? "bg-amber-500"
                                  : task.owner === "Mark"
                                    ? "bg-green-500"
                                    : "bg-slate-400"
                            )}
                          ></div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Detail Panel (Desktop only) */}
        <div className="hidden border-l border-slate-200 bg-white overflow-y-auto sm:block">
          <PlannerDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            isVisible={selectedTask !== null}
          />
        </div>
      </div>

      {/* Mobile detail sheet */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 z-30 bg-black/30 sm:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white sm:hidden"
            >
              <PlannerDetailPanel
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                isVisible={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
