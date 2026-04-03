import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Circle,
  Search,
  Filter,
  User,
  StickyNote,
  AlertTriangle,
  ChevronRight,
  X,
  Trash2,
  ArrowUpDown,
  Cloud,
  CloudOff,
  Smartphone,
  Download,
  RefreshCw,
  Settings2,
  Copy,
  Wifi,
  WifiOff,
  Check,
  Bug,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff
} from "lucide-react";
import {
  WORKSPACE,
  classNames,
  dueLabel,
  formatDate,
  getDaysLeft,
  makeStarterTasks,
  mapRow,
  readLocalConfig,
  readLocalTasks,
  safeRandomId,
  sortTasks,
  validateSupabaseConfig,
  writeLocalConfig,
  writeLocalTasks,
  parseVoiceTask
} from "./lib/taskUtils.js";

const ownerStyles = {
  Dale: { chip: "bg-sky-100 text-sky-700 border-sky-200" },
  Mick: { chip: "bg-amber-100 text-amber-700 border-amber-200" },
  Unassigned: { chip: "bg-slate-100 text-slate-700 border-slate-200" }
};

const statusMeta = {
  "To Do": { icon: Circle, badge: "bg-slate-100 text-slate-700 border-slate-200" },
  "In Progress": { icon: Clock3, badge: "bg-violet-100 text-violet-700 border-violet-200" },
  Done: { icon: CheckCircle2, badge: "bg-emerald-100 text-emerald-700 border-emerald-200" }
};

const priorityMeta = {
  Low: "bg-slate-100 text-slate-700 border-slate-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  High: "bg-rose-100 text-rose-700 border-rose-200"
};

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <CheckCircle2 className="h-7 w-7 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No tasks match your filters</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Clear a filter or add a task to get things moving again.
      </p>
      <button onClick={onAdd} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
        <Plus className="h-4 w-4" />
        Add task
      </button>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, helper, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "bg-rose-50 border-rose-100"
      : tone === "success"
        ? "bg-emerald-50 border-emerald-100"
        : "bg-white border-slate-200";

  return (
    <div className={classNames("rounded-3xl border p-4 shadow-sm", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-2 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={classNames("min-w-fit flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition", value === option ? "bg-white text-slate-900 shadow-sm" : "text-slate-600")}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function InstallBanner({ installAvailable, onInstall }) {
  if (!installAvailable) return null;
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-600 p-2 text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">Install on phone</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            This app can be added to the home screen for quicker access, more like a normal phone app.
          </p>
          <button onClick={onInstall} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
            <Smartphone className="h-4 w-4" />
            Install app
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupPanel({ open, onToggle, config, onConfigChange, onSaveConfig, syncEnabled, connectionState, onSeedCloud, seeding, syncMessage }) {
  const [copied, setCopied] = useState(false);
  const sql = `create table if not exists public.tasks (
  id text primary key,
  workspace text not null default 'dale-mick',
  title text not null,
  owner text not null default 'Unassigned',
  status text not null default 'To Do',
  priority text not null default 'Medium',
  due_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

do $$ begin
  create policy "Allow read tasks" on public.tasks
  for select to anon
  using (workspace = 'dale-mick');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Allow insert tasks" on public.tasks
  for insert to anon
  with check (workspace = 'dale-mick');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Allow update tasks" on public.tasks
  for update to anon
  using (workspace = 'dale-mick')
  with check (workspace = 'dale-mick');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Allow delete tasks" on public.tasks
  for delete to anon
  using (workspace = 'dale-mick');
exception when duplicate_object then null; end $$;`;

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Shared sync setup</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Connect Supabase once and both phones can see live updates instantly.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Settings2 className="h-5 w-5" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Supabase project URL</label>
                  <input value={config.supabaseUrl} onChange={(e) => onConfigChange("supabaseUrl", e.target.value)} placeholder="https://your-project.supabase.co" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Supabase anon key</label>
                  <textarea value={config.supabaseAnonKey} onChange={(e) => onConfigChange("supabaseAnonKey", e.target.value)} placeholder="Paste anon public key" rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={onSaveConfig} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">
                  <Cloud className="h-4 w-4" />
                  Save and connect
                </button>
                {syncEnabled ? (
                  <button onClick={onSeedCloud} disabled={seeding} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60">
                    <RefreshCw className={classNames("h-4 w-4", seeding ? "animate-spin" : "")} />
                    Seed cloud with current tasks
                  </button>
                ) : null}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  {connectionState === "connected" ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  Connection status: {connectionState}
                </div>
                <p className="mt-2">In local mode the app still works on one phone. Once connected, tasks sync live across Dale and Mick’s phones using the same database.</p>
                {syncMessage ? <p className="mt-2 text-slate-700">{syncMessage}</p> : null}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">SQL to create the tasks table</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Paste this into the Supabase SQL editor once, then save your project URL and anon key above.
                    </p>
                  </div>
                  <button onClick={copySql} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy SQL"}
                  </button>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{sql}</pre>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TaskForm({ initialValue, onClose, onSave, onDelete, autoStartVoice = false }) {
  const [form, setForm] = useState(
    initialValue || {
      id: safeRandomId(),
      workspace: WORKSPACE,
      title: "",
      owner: "Dale",
      status: "To Do",
      priority: "Medium",
      due_date: "",
      notes: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const autoStartedRef = useRef(false);

  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  useEffect(() => {
    if (!autoStartVoice || !voiceSupported || autoStartedRef.current) return;
    autoStartedRef.current = true;
    startVoiceInput();
  }, [autoStartVoice, voiceSupported]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyTranscript(transcript) {
    setForm((current) => {
      const updatedForm = {
        ...current,
        ...parseVoiceTask(transcript, current),
        updated_at: new Date().toISOString(),
      };

      const finalTask = {
        ...updatedForm,
        workspace: WORKSPACE,
        title: (updatedForm.title || "").trim(),
        notes: (updatedForm.notes || "").trim(),
        status: updatedForm.status || "To Do",
      };

      if (finalTask.title) {
        setTimeout(() => {
          onSave(finalTask);
        }, 0);
      }

      return updatedForm;
    });
  }

  function stopVoiceInput() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }

  function startVoiceInput() {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        "Voice input is not supported in this browser. Try Chrome on Android or a supported iPhone browser."
      );
      return;
    }

    try {
      setVoiceError("");
      const recognition = new SpeechRecognition();
      recognition.lang = "en-GB";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError("");
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result?.[0]?.transcript || "")
          .join(" ")
          .trim();

        if (transcript) {
          applyTranscript(transcript);
          stopVoiceInput();
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        const code = event?.error || "unknown";

        if (code === "not-allowed") {
          setVoiceError(
            "Microphone permission was blocked. Allow microphone access in your browser settings and try again."
          );
        } else if (code === "no-speech") {
          setVoiceError("No speech was detected. Tap the mic and try again.");
        } else {
          setVoiceError(`Voice input failed: ${code}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      setIsListening(false);
      setVoiceError(error?.message || "Could not start voice input.");
    }
  }

  function toggleVoiceInput() {
    if (isListening) {
      stopVoiceInput();
      return;
    }
    startVoiceInput();
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    onSave({
      ...form,
      workspace: WORKSPACE,
      title: form.title.trim(),
      notes: form.notes.trim(),
      updated_at: new Date().toISOString(),
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6"
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="max-h-[92vh] w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {isEdit ? "Edit task" : "New task"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Assign it, give it a due date, add notes, or dictate it by voice.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Task title</label>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter task"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900"
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={!voiceSupported && !isListening}
                  className={classNames(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isListening
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-900 text-white hover:bg-slate-800",
                    !voiceSupported && !isListening ? "cursor-not-allowed opacity-60" : ""
                  )}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isListening ? "Stop listening" : "Add by voice"}
                </button>
                <div className="flex items-center text-sm text-slate-500">
                  Example: “Call Mick about the site tomorrow, high priority”
                </div>
              </div>
              {voiceError ? <p className="mt-3 text-sm text-rose-600">{voiceError}</p> : null}
              {!voiceSupported ? (
                <p className="mt-3 text-sm text-slate-500">
                  Voice entry is not supported in this browser preview.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Responsible</label>
                <select
                  value={form.owner}
                  onChange={(e) => updateField("owner", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900"
                >
                  <option>Dale</option>
                  <option>Mick</option>
                  <option>Unassigned</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Due date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => updateField("due_date", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900"
                >
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => updateField("priority", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Add job details, follow-ups, material notes, access times, or reminders"
                rows={3}
                className="w-full min-h-[96px] max-h-40 resize-none overflow-y-auto rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900 sm:min-h-[120px]"
              />
            </div>

            <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white px-5 pt-4 pb-3 sm:-mx-6 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                  {isEdit ? (
                    <button
                      type="button"
                      onClick={() => onDelete(form.id)}
                      className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  ) : null}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    {isEdit ? "Save changes" : "Add task"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TaskCard({ task, onEdit, onQuickStatus }) {
  const ownerStyle = ownerStyles[task.owner] || ownerStyles.Unassigned;
  const statusInfo = statusMeta[task.status] || statusMeta["To Do"];
  const StatusIcon = statusInfo.icon;
  const days = getDaysLeft(task.due_date);
  const isOverdue = task.status !== "Done" && days !== null && days < 0;

  return (
    <motion.button layout onClick={() => onEdit(task)} className={classNames("w-full rounded-[28px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", isOverdue ? "border-rose-200" : "border-slate-200")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={classNames("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", ownerStyle.chip)}>
              <User className="mr-1.5 h-3.5 w-3.5" />
              {task.owner}
            </span>
            <span className={classNames("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", statusInfo.badge)}>
              <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
              {task.status}
            </span>
            <span className={classNames("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", priorityMeta[task.priority] || priorityMeta.Medium)}>
              {task.priority}
            </span>
          </div>

          <h3 className="text-base font-semibold leading-6 text-slate-900">{task.title}</h3>
          {task.notes ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{task.notes}</p> : <p className="mt-2 text-sm leading-6 text-slate-400">No notes added yet</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <CalendarDays className="h-4 w-4" />
              <span>{formatDate(task.due_date)}</span>
            </div>
            <div className={classNames("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium", isOverdue ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700")}>
              {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
              {dueLabel(task.due_date, task.status)}
            </div>
          </div>
        </div>

        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {task.status !== "To Do" ? <button onClick={(e) => { e.stopPropagation(); onQuickStatus(task.id, "To Do"); }} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200">Move to To Do</button> : null}
        {task.status !== "In Progress" ? <button onClick={(e) => { e.stopPropagation(); onQuickStatus(task.id, "In Progress"); }} className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-200">Start task</button> : null}
        {task.status !== "Done" ? <button onClick={(e) => { e.stopPropagation(); onQuickStatus(task.id, "Done"); }} className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200">Mark done</button> : null}
      </div>
    </motion.button>
  );
}

function runSelfTests() {
  const results = [];
  function test(name, fn) {
    try { fn(); results.push({ name, pass: true }); }
    catch (error) { results.push({ name, pass: false, message: error?.message || String(error) }); }
  }
  function assert(condition, message) { if (!condition) throw new Error(message); }
  test("starter tasks include two tasks", () => { const starter = makeStarterTasks(); assert(starter.length === 2, "Expected two starter tasks"); });
  test("validateSupabaseConfig accepts valid looking config", () => { const result = validateSupabaseConfig("https://example.supabase.co", "public-anon-key"); assert(result.ok === true, "Expected valid-looking config to pass"); });
  return results;
}

function DebugPanel({ results }) {
  const [open, setOpen] = useState(false);
  const passed = results.filter((result) => result.pass).length;
  const failed = results.length - passed;
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <button onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-2 text-slate-700"><Bug className="h-5 w-5" /></div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Built-in checks</h3>
            <p className="mt-1 text-sm text-slate-500">{passed} passed{failed ? ` · ${failed} failed` : " · no failures"}</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              {results.map((result) => (
                <div key={result.name} className={classNames("rounded-2xl border px-4 py-3 text-sm", result.pass ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800")}>
                  <div className="font-medium">{result.name}</div>
                  {!result.pass && result.message ? <div className="mt-1 text-xs">{result.message}</div> : null}
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(() => readLocalTasks());
  const [config, setConfig] = useState(() => readLocalConfig());
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortMode, setSortMode] = useState("due");
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [connectionState, setConnectionState] = useState("local mode");
  const [setupOpen, setSetupOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [syncMessage, setSyncMessage] = useState("The app starts in local mode so it still works even if Supabase is not available.");
  const [voiceStartRequested, setVoiceStartRequested] = useState(false);
  const supabaseRef = useRef(null);
  const channelRef = useRef(null);
  const clientFactoryRef = useRef(null);
  const selfTestResults = useMemo(() => runSelfTests(), []);

  useEffect(() => { writeLocalTasks(tasks); }, [tasks]);
  useEffect(() => { writeLocalConfig(config); }, [config]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPromptEvent(event);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const saved = readLocalConfig();
    if (saved.supabaseUrl && saved.supabaseAnonKey) connectSupabase(saved.supabaseUrl, saved.supabaseAnonKey);
    return () => { if (channelRef.current && supabaseRef.current?.removeChannel) supabaseRef.current.removeChannel(channelRef.current); };
  }, []);

  async function getSupabaseCreateClient() {
    if (clientFactoryRef.current) return clientFactoryRef.current;
    try {
      const module = await import("@supabase/supabase-js");
      const createClient = module?.createClient;
      if (typeof createClient !== "function") throw new Error("Supabase loaded, but createClient was not available.");
      clientFactoryRef.current = createClient;
      return createClient;
    } catch (error) {
      throw new Error(error?.message ? `Could not load Supabase in this environment: ${error.message}` : "Could not load Supabase in this environment.");
    }
  }

  async function refreshTasksFromCloud(client) {
    const { data, error } = await client.from("tasks").select("*").eq("workspace", WORKSPACE).order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map(mapRow);
    if (rows.length) { setTasks(rows); writeLocalTasks(rows); }
  }

  async function connectSupabase(url, key) {
    const validation = validateSupabaseConfig(url, key);
    if (!validation.ok) {
      setSyncEnabled(false);
      setConnectionState("config needed");
      setSyncMessage(validation.message);
      return;
    }
    try {
      setConnectionState("connecting");
      setSyncMessage("Trying to connect to Supabase...");
      const createClient = await getSupabaseCreateClient();
      const client = createClient(url.trim(), key.trim());
      supabaseRef.current = client;
      await refreshTasksFromCloud(client);
      setSyncEnabled(true);
      setConnectionState("connected");
      setSyncMessage("Connected successfully. Changes can now sync between phones.");

      if (channelRef.current && client.removeChannel) client.removeChannel(channelRef.current);

      if (client.channel) {
        const channel = client.channel("dale-mick-tasks-live").on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `workspace=eq.${WORKSPACE}` }, async () => {
          try { await refreshTasksFromCloud(client); }
          catch (refreshError) { setSyncMessage(refreshError?.message ? `Connected, but refresh failed: ${refreshError.message}` : "Connected, but refresh failed."); }
        }).subscribe((status) => { if (status === "SUBSCRIBED") setConnectionState("connected"); });
        channelRef.current = channel;
      }
    } catch (error) {
      console.error(error);
      setSyncEnabled(false);
      setConnectionState("connection failed");
      setSyncMessage(error?.message || "The connection failed for an unknown reason.");
    }
  }

  async function handleSaveConfig() {
    writeLocalConfig(config);
    await connectSupabase(config.supabaseUrl, config.supabaseAnonKey);
  }

  async function pushTaskToCloud(task) {
    if (!supabaseRef.current) return;
    const payload = { id: task.id, workspace: WORKSPACE, title: task.title, owner: task.owner, status: task.status, priority: task.priority, due_date: task.due_date || null, notes: task.notes || "", created_at: task.created_at, updated_at: task.updated_at || new Date().toISOString() };
    const { error } = await supabaseRef.current.from("tasks").upsert(payload);
    if (error) throw error;
  }

  async function deleteTaskFromCloud(id) {
    if (!supabaseRef.current) return;
    const { error } = await supabaseRef.current.from("tasks").delete().eq("id", id).eq("workspace", WORKSPACE);
    if (error) throw error;
  }

  async function seedCloudWithCurrentTasks() {
    if (!supabaseRef.current) { setSyncMessage("Connect to Supabase first, then seed the cloud with current tasks."); return; }
    try {
      setSeeding(true);
      const payload = tasks.map((task) => ({ id: task.id, workspace: WORKSPACE, title: task.title, owner: task.owner, status: task.status, priority: task.priority, due_date: task.due_date || null, notes: task.notes || "", created_at: task.created_at, updated_at: task.updated_at || new Date().toISOString() }));
      const { error } = await supabaseRef.current.from("tasks").upsert(payload);
      if (error) throw error;
      setSyncMessage("Cloud seed completed.");
    } catch (error) {
      console.error(error);
      setConnectionState("seed failed");
      setSyncMessage(error?.message || "Seeding the cloud failed.");
    } finally { setSeeding(false); }
  }

  async function handleInstall() {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    setInstallPromptEvent(null);
  }

  function updateConfigField(key, value) { setConfig((current) => ({ ...current, [key]: value })); }

  async function handleSaveTask(task) {
    const normalized = { ...task, workspace: WORKSPACE, created_at: task.created_at || new Date().toISOString(), updated_at: new Date().toISOString() };
    setTasks((current) => {
      const exists = current.some((item) => item.id === normalized.id);
      if (exists) return current.map((item) => (item.id === normalized.id ? normalized : item));
      return [normalized, ...current];
    });
    setShowForm(false);
    setEditingTask(null);
    setVoiceStartRequested(false);
    if (syncEnabled) {
      try { await pushTaskToCloud(normalized); }
      catch (error) { console.error(error); setConnectionState("sync error"); setSyncMessage(error?.message || "The task saved locally, but cloud sync failed."); }
    }
  }

  async function handleDeleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setShowForm(false);
    setEditingTask(null);
    setVoiceStartRequested(false);
    if (syncEnabled) {
      try { await deleteTaskFromCloud(id); }
      catch (error) { console.error(error); setConnectionState("sync error"); setSyncMessage(error?.message || "The task was removed locally, but cloud delete failed."); }
    }
  }

  async function handleQuickStatus(id, status) {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) return;
    const updated = { ...currentTask, status, updated_at: new Date().toISOString() };
    setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
    if (syncEnabled) {
      try { await pushTaskToCloud(updated); }
      catch (error) { console.error(error); setConnectionState("sync error"); setSyncMessage(error?.message || "The status changed locally, but cloud sync failed."); }
    }
  }

  function openNewTask(startWithVoice = false) { setEditingTask(null); setVoiceStartRequested(startWithVoice); setShowForm(true); }
  function openEditTask(task) { setEditingTask(task); setVoiceStartRequested(false); setShowForm(true); }

  const filteredTasks = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      const taskTitle = task.title || "";
      const taskNotes = task.notes || "";
      const matchesQuery = !lower || taskTitle.toLowerCase().includes(lower) || taskNotes.toLowerCase().includes(lower);
      const matchesOwner = ownerFilter === "All" || task.owner === ownerFilter;
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      return matchesQuery && matchesOwner && matchesStatus;
    });
    return sortTasks(filtered, sortMode);
  }, [tasks, query, ownerFilter, statusFilter, sortMode]);

  const stats = useMemo(() => {
    const overdue = tasks.filter((task) => task.status !== "Done" && getDaysLeft(task.due_date) < 0).length;
    const today = tasks.filter((task) => task.status !== "Done" && getDaysLeft(task.due_date) === 0).length;
    const open = tasks.filter((task) => task.status !== "Done").length;
    const done = tasks.filter((task) => task.status === "Done").length;
    return { overdue, today, open, done };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
        <div className="mb-5 overflow-hidden rounded-[32px] bg-slate-900 text-white shadow-xl">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)] px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">Shared mobile app</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Dale & Mick Tasks</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Built as a cleaner mobile task app with local-first behaviour, optional cloud sync, quick edits, and owner colour coding.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className={classNames("inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium", syncEnabled ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-slate-200")}>
                  {syncEnabled ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
                  {syncEnabled ? "Live sync ready" : "Local mode"}
                </div>
                <button onClick={() => openNewTask(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20">
                  <Mic className="h-4 w-4" />
                  Voice task
                </button>
                <button onClick={() => openNewTask(false)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <InstallBanner installAvailable={Boolean(installPromptEvent)} onInstall={handleInstall} />
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-900 p-2 text-white">{syncEnabled ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Connection status</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{connectionState}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{syncMessage}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Open tasks" value={stats.open} icon={Clock3} helper="Still needing action" />
          <StatCard label="Due today" value={stats.today} icon={CalendarDays} helper="Needs attention now" />
          <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} helper="Past target date" tone="danger" />
          <StatCard label="Completed" value={stats.done} icon={CheckCircle2} helper="Marked as done" tone="success" />
        </div>

        <div className="mt-5 rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks or notes" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base outline-none transition focus:border-slate-900" />
            </div>
            <div className="rounded-2xl border border-slate-200 p-1"><SegmentedControl value={ownerFilter} onChange={setOwnerFilter} options={["All", "Dale", "Mick"]} /></div>
            <div className="rounded-2xl border border-slate-200 p-1"><SegmentedControl value={statusFilter} onChange={setStatusFilter} options={["All", "To Do", "In Progress", "Done"]} /></div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-600">
              <ArrowUpDown className="h-4 w-4" />
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="w-full bg-transparent outline-none">
                <option value="due">Sort: Due date</option>
                <option value="priority">Sort: Priority</option>
                <option value="owner">Sort: Owner</option>
                <option value="newest">Sort: Recently updated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
                <p className="text-sm text-slate-500">Tap a card to edit it</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                <Filter className="h-4 w-4" />
                {filteredTasks.length} shown
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredTasks.length ? filteredTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={openEditTask} onQuickStatus={handleQuickStatus} />) : <EmptyState onAdd={() => openNewTask(false)} />}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <SetupPanel open={setupOpen} onToggle={() => setSetupOpen((current) => !current)} config={config} onConfigChange={updateConfigField} onSaveConfig={handleSaveConfig} syncEnabled={syncEnabled} connectionState={connectionState} onSeedCloud={seedCloudWithCurrentTasks} seeding={seeding} syncMessage={syncMessage} />
            <DebugPanel results={selfTestResults} />

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Owner guide</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">Colour coding makes responsibility obvious at a glance.</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3">
                  <div><p className="font-medium text-slate-900">Dale</p><p className="text-sm text-slate-600">Blue owner tags</p></div>
                  <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-medium text-white">Owner</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                  <div><p className="font-medium text-slate-900">Mick</p><p className="text-sm text-slate-600">Amber owner tags</p></div>
                  <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white">Owner</span>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Useful touches built in</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3"><StickyNote className="mt-0.5 h-4 w-4 text-slate-500" /><p>Every task includes notes for materials, access times, phone calls, and reminders.</p></div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3"><CalendarDays className="mt-0.5 h-4 w-4 text-slate-500" /><p>Due dates automatically show what is due today, upcoming, or overdue.</p></div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3"><RefreshCw className="mt-0.5 h-4 w-4 text-slate-500" /><p>The app runs in local mode first, so Supabase problems do not stop the main task app from loading.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => openNewTask(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900">
            <Mic className="h-4 w-4" />
            Voice task
          </button>
          <button onClick={() => openNewTask(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Add task
          </button>
        </div>
      </div>

      {showForm ? <TaskForm initialValue={editingTask} autoStartVoice={voiceStartRequested} onClose={() => { setShowForm(false); setEditingTask(null); setVoiceStartRequested(false); }} onSave={handleSaveTask} onDelete={handleDeleteTask} /> : null}
    </div>
  );
}
