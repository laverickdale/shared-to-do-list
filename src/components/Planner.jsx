import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  User,
  Calendar,
  Plus,
} from "lucide-react";
import { getDaysLeft, formatDate, classNames } from "../lib/taskUtils.js";

const ownerColors = {
  Dale: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    pill: "bg-sky-100 text-sky-700",
  },
  Mick: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    pill: "bg-amber-100 text-amber-700",
  },
  Mark: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    pill: "bg-green-100 text-green-700",
  },
  Kayl: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    pill: "bg-emerald-100 text-emerald-700",
  },
  Unassigned: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    pill: "bg-slate-100 text-slate-700",
  },
};

function PlannerDetailPanel({ task, onClose, onEdit, onStatusChange, isVisible }) {
  if (!task || !isVisible) return null;

  const statusOptions = ["To Do", "In Progress", "Done"];
  const currentOwnerColor = ownerColors[task.owner] || ownerColors.Unassigned;
  const daysLeft = getDaysLeft(task.due_date);
  const isOverdue = task.status !== "Done" && daysLeft !== null && daysLeft < 0;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Task details
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{task.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {task.status === "Done" ? "Completed" : isOverdue ? "Overdue" : "Active"}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Owner
          </p>
          <span
            className={classNames(
              "inline-flex rounded-full px-3 py-1 text-sm font-medium",
              currentOwnerColor.pill
            )}
          >
            <User className="mr-2 h-4 w-4" />
            {task.owner}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(task.id, status)}
                className={classNames(
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
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

        {task.due_date && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Due date
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Calendar className="h-4 w-4" />
              {formatDate(task.due_date)}
            </div>
          </div>
        )}

        {(task.start_time || task.end_time) && !task.all_day && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Time
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4" />
              {task.start_time || ""}
              {task.start_time && task.end_time ? " – " : ""}
              {task.end_time || ""}
            </div>
          </div>
        )}

        {task.location && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Location
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPin className="h-4 w-4" />
              {task.location}
            </div>
          </div>
        )}

        {task.priority && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Priority
            </p>
            <div className="text-sm text-slate-700">{task.priority}</div>
          </div>
        )}

        {task.notes && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Notes
            </p>
            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {task.notes}
            </div>
          </div>
        )}

        <button
          onClick={() => onEdit(task)}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Edit task
        </button>
      </div>
    </div>
  );
}

function MiniCalendar({ selectedDate, onDateSelect }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));

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

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const days = [];
  const firstDay = getFirstDayOfMonth(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isSelected = (day) => {
    if (!day) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth.getMonth() &&
      selectedDate.getFullYear() === viewMonth.getFullYear()
    );
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h3 className="text-sm font-semibold text-slate-900">
          {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </h3>

        <button
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <button
            key={`${day}-${idx}`}
            onClick={() => {
              if (!day) return;
              onDateSelect(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
            }}
            className={classNames(
              "rounded-lg py-2 text-xs font-medium transition",
              day === null
                ? "cursor-default"
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
        className="mt-4 w-full rounded-xl border border-slate-300 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Today
      </button>
    </div>
  );
}

function WeekView({ tasks, selectedDate, onTaskClick }) {
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

  const unscheduledTasks = tasks.filter((task) => !task.due_date && task.show_on_calendar !== false);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
        {weekDays.map((date) => {
          const key = date.toISOString().split("T")[0];
          const dayTasks = tasksByDate[key] || [];
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={key}
              className={classNames(
                "rounded-[24px] border bg-white p-4 shadow-sm",
                isToday ? "border-slate-900" : "border-slate-200"
              )}
            >
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{date.getDate()}</p>
              </div>

              <div className="space-y-2">
                {dayTasks.length > 0 ? (
                  dayTasks.map((task) => (
                    <motion.button
                      key={task.id}
                      layout
                      onClick={() => onTaskClick(task)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                    >
                      <div className="text-sm font-medium text-slate-900">{task.title}</div>
                      {task.start_time ? (
                        <div className="mt-1 text-xs text-slate-500">{task.start_time}</div>
                      ) : null}
                    </motion.button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unscheduledTasks.length > 0 ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            To Schedule ({unscheduledTasks.length})
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {unscheduledTasks.map((task) => (
              <motion.button
                key={task.id}
                layout
                onClick={() => onTaskClick(task)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
              >
                <div className="text-sm font-medium text-slate-900">{task.title}</div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TodayView({ tasks, onTaskClick, onNewTask }) {
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((task) => task.due_date === today && task.show_on_calendar !== false);
  const overdueTasks = tasks.filter(
    (task) => task.status !== "Done" && task.due_date && task.due_date < today && task.show_on_calendar !== false
  );

  return (
    <div className="space-y-5">
      {overdueTasks.length > 0 ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-rose-800">Overdue ({overdueTasks.length})</h3>
          <div className="mt-4 space-y-3">
            {overdueTasks.map((task) => (
              <motion.button
                key={task.id}
                onClick={() => onTaskClick(task)}
                layout
                className="w-full rounded-2xl border border-rose-200 bg-white p-4 text-left"
              >
                <div className="font-medium text-slate-900">{task.title}</div>
                <div className="mt-1 text-sm text-rose-700">Due: {formatDate(task.due_date)}</div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Today</h3>

        {todayTasks.length > 0 ? (
          <div className="mt-4 space-y-3">
            {todayTasks.map((task) => (
              <motion.button
                key={task.id}
                onClick={() => onTaskClick(task)}
                layout
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
              >
                <div className="font-medium text-slate-900">{task.title}</div>
                {task.start_time ? (
                  <div className="mt-1 text-sm text-slate-500">{task.start_time}</div>
                ) : null}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-slate-500">Nothing due today</p>
            <button
              onClick={onNewTask}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Add a task
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
  onNewTask,
  onBack,
}) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState("week");

  const agendaTasks = useMemo(() => {
    return tasks
      .filter((task) => task.show_on_calendar !== false)
      .sort((a, b) => (a.due_date || "9999-12-31").localeCompare(b.due_date || "9999-12-31"));
  }, [tasks]);

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Planner</h1>
            <p className="mt-1 text-sm text-slate-500">Select a date to view</p>
          </div>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Tasks
          </button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
          <div className="hidden xl:block space-y-5">
            <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Views
              </h3>

              <div className="space-y-2">
                {[
                  { id: "today", label: "Today" },
                  { id: "week", label: "This Week" },
                  { id: "agenda", label: "Agenda" },
                  { id: "month", label: "Month" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={classNames(
                      "w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition",
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
          </div>

          <div className="space-y-4">
            <div className="overflow-x-auto xl:hidden">
              <div className="flex gap-2">
                {[
                  { id: "today", label: "Today" },
                  { id: "week", label: "Week" },
                  { id: "agenda", label: "Agenda" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={classNames(
                      "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition",
                      view === v.id
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 bg-white text-slate-700"
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {view === "today" ? (
              <TodayView tasks={tasks} onTaskClick={setSelectedTask} onNewTask={onNewTask} />
            ) : null}
            {view === "week" ? (
              <WeekView tasks={tasks} selectedDate={selectedDate} onTaskClick={setSelectedTask} />
            ) : null}

            {view === "agenda" ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Agenda</h3>

                <div className="mt-4 space-y-3">
                  {agendaTasks.map((task) => (
                    <motion.button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      layout
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                    >
                      <div className="font-medium text-slate-900">{task.title}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {task.due_date ? formatDate(task.due_date) : "No date"}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : null}

            {view === "month" ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Month view</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Month view can be added next. Week and agenda are ready now.
                </p>
              </div>
            ) : null}
          </div>

          <div className="hidden xl:block">
            <PlannerDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              isVisible={selectedTask !== null}
            />
          </div>
        </div>

        {selectedTask ? (
          <>
            <button
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 z-30 bg-black/30 xl:hidden"
            />
            <div className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl xl:hidden">
              <PlannerDetailPanel
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                isVisible={true}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
