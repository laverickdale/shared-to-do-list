export const LOCAL_TASKS_KEY = "dale-mick-shared-app-local-tasks-v4";
export const LOCAL_CONFIG_KEY = "dale-mick-shared-app-config-v4";
export const WORKSPACE = "dale-mick";

export function safeRandomId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function inDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function makeStarterTasks() {
  return [
    {
      id: safeRandomId(),
      workspace: WORKSPACE,
      title: "Order emergency light fittings",
      owner: "Dale",
      status: "To Do",
      priority: "High",
      due_date: inDays(2),
      notes: "Confirm supplier lead time and verify quantities before ordering.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: safeRandomId(),
      workspace: WORKSPACE,
      title: "Call client about access times",
      owner: "Mick",
      status: "In Progress",
      priority: "Medium",
      due_date: inDays(1),
      notes: "Need final confirmation for Thursday morning start.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

export function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

export function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getDaysLeft(value) {
  if (!value) return null;
  const today = new Date();
  const due = new Date(`${value}T12:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((startOfDue - startOfToday) / 86400000);
}

export function dueLabel(value, status) {
  if (!value) return "No due date";
  if (status === "Done") return `Done · due ${formatDate(value)}`;
  const days = getDaysLeft(value);
  if (days === null) return "No due date";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `${days} days left`;
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}

export function sortTasks(tasks, mode) {
  const sorted = [...tasks];
  if (mode === "due") {
    return sorted.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
  }
  if (mode === "priority") {
    const order = { High: 0, Medium: 1, Low: 2 };
    return sorted.sort((a, b) => (order[a.priority] ?? 999) - (order[b.priority] ?? 999));
  }
  if (mode === "owner") {
    return sorted.sort((a, b) => (a.owner || "").localeCompare(b.owner || ""));
  }
  return sorted.sort(
    (a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
  );
}

export function readLocalTasks() {
  if (typeof window === "undefined") return makeStarterTasks();
  try {
    const raw = window.localStorage.getItem(LOCAL_TASKS_KEY);
    if (!raw) {
      const starter = makeStarterTasks();
      window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(starter));
      return starter;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    const starter = makeStarterTasks();
    window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(starter));
    return starter;
  } catch {
    return makeStarterTasks();
  }
}

export function writeLocalTasks(tasks) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

export function readLocalConfig() {
  const envUrl = import.meta?.env?.VITE_SUPABASE_URL || "";
  const envKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";
  if (typeof window === "undefined") return { supabaseUrl: envUrl, supabaseAnonKey: envKey };
  try {
    const raw = window.localStorage.getItem(LOCAL_CONFIG_KEY);
    if (!raw) return { supabaseUrl: envUrl, supabaseAnonKey: envKey };
    const parsed = JSON.parse(raw);
    return {
      supabaseUrl: parsed.supabaseUrl || envUrl,
      supabaseAnonKey: parsed.supabaseAnonKey || envKey,
    };
  } catch {
    return { supabaseUrl: envUrl, supabaseAnonKey: envKey };
  }
}

export function writeLocalConfig(config) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function mapRow(row) {
  return {
    id: row.id,
    workspace: row.workspace || WORKSPACE,
    title: row.title || "",
    owner: row.owner || "Unassigned",
    status: row.status || "To Do",
    priority: row.priority || "Medium",
    due_date: row.due_date || "",
    notes: row.notes || "",
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export function validateSupabaseConfig(url, key) {
  if (!url.trim() && !key.trim()) return { ok: false, message: "Enter a Supabase project URL and anon key first." };
  if (!url.trim()) return { ok: false, message: "Enter your Supabase project URL." };
  if (!key.trim()) return { ok: false, message: "Enter your Supabase anon key." };
  if (!/^https:\/\//i.test(url.trim())) return { ok: false, message: "The Supabase URL should start with https://" };
  return { ok: true, message: "" };
}

export function getNextWeekdayDate(dayName) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const targetIndex = days.indexOf(dayName.toLowerCase());
  if (targetIndex === -1) return "";
  const now = new Date();
  const currentIndex = now.getDay();
  let diff = targetIndex - currentIndex;
  if (diff <= 0) diff += 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return next.toISOString().slice(0, 10);
}

export function extractVoiceDate(text) {
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower)) {
    return { due_date: inDays(0), cleaned: text.replace(/\btoday\b/gi, "").trim() };
  }
  if (/\btomorrow\b/.test(lower)) {
    return { due_date: inDays(1), cleaned: text.replace(/\btomorrow\b/gi, "").trim() };
  }
  const weekdayMatch = lower.match(/\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) {
    return {
      due_date: getNextWeekdayDate(weekdayMatch[1]),
      cleaned: text.replace(new RegExp(`\\b(?:on\\s+)?${weekdayMatch[1]}\\b`, "i"), "").trim(),
    };
  }
  return { due_date: "", cleaned: text.trim() };
}

export function extractVoiceOwner(text, currentOwner = "Dale") {
  if (/\bassign to mick\b|\bfor mick\b/i.test(text)) {
    return { owner: "Mick", cleaned: text.replace(/\bassign to mick\b|\bfor mick\b/gi, "").trim() };
  }
  if (/\bassign to dale\b|\bfor dale\b/i.test(text)) {
    return { owner: "Dale", cleaned: text.replace(/\bassign to dale\b|\bfor dale\b/gi, "").trim() };
  }
  return { owner: currentOwner, cleaned: text.trim() };
}

export function extractVoicePriority(text, currentPriority = "Medium") {
  if (/\bhigh priority\b|\burgent\b/i.test(text)) {
    return { priority: "High", cleaned: text.replace(/\bhigh priority\b|\burgent\b/gi, "").trim() };
  }
  if (/\blow priority\b/i.test(text)) {
    return { priority: "Low", cleaned: text.replace(/\blow priority\b/gi, "").trim() };
  }
  if (/\bmedium priority\b/i.test(text)) {
    return { priority: "Medium", cleaned: text.replace(/\bmedium priority\b/gi, "").trim() };
  }
  return { priority: currentPriority, cleaned: text.trim() };
}

export function cleanVoiceTitle(text) {
  return text.replace(/\s{2,}/g, " ").replace(/^[-,:;]+|[-,:;]+$/g, "").trim();
}

export function parseVoiceTask(transcript, currentForm) {
  const original = transcript.trim();
  let working = original;
  const ownerInfo = extractVoiceOwner(working, currentForm.owner);
  working = ownerInfo.cleaned;
  const dateInfo = extractVoiceDate(working);
  working = dateInfo.cleaned;
  const priorityInfo = extractVoicePriority(working, currentForm.priority);
  working = priorityInfo.cleaned;
  const title = cleanVoiceTitle(working) || original;
  return {
    title,
    owner: ownerInfo.owner,
    due_date: dateInfo.due_date || currentForm.due_date,
    priority: priorityInfo.priority,
    notes: currentForm.notes ? `${currentForm.notes}\n\nVoice note: ${original}` : `Voice note: ${original}`,
  };
}
