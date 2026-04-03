import { createClient } from '@supabase/supabase-js';

const WORKSPACE = 'dale-mick';
const ALLOWED_OWNERS = new Set(['Dale', 'Mick', 'Unassigned']);
const ALLOWED_PRIORITIES = new Set(['Low', 'Medium', 'High']);

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-voice-task-token',
  };
}

function safeRandomId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getNextWeekdayDate(dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetIndex = days.indexOf(dayName.toLowerCase());
  if (targetIndex === -1) return '';

  const now = new Date();
  const currentIndex = now.getDay();
  let diff = targetIndex - currentIndex;
  if (diff <= 0) diff += 7;

  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return next.toISOString().slice(0, 10);
}

function extractVoiceDate(text) {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) {
    return {
      due_date: inDays(0),
      cleaned: text.replace(/\btoday\b/gi, '').trim(),
    };
  }

  if (/\btomorrow\b/.test(lower)) {
    return {
      due_date: inDays(1),
      cleaned: text.replace(/\btomorrow\b/gi, '').trim(),
    };
  }

  const weekdayMatch = lower.match(/\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) {
    return {
      due_date: getNextWeekdayDate(weekdayMatch[1]),
      cleaned: text.replace(new RegExp(`\\b(?:on\\s+)?${weekdayMatch[1]}\\b`, 'i'), '').trim(),
    };
  }

  return { due_date: '', cleaned: text.trim() };
}

function extractVoiceOwner(text, fallbackOwner = 'Dale') {
  if (/\bassign to mick\b|\bfor mick\b/i.test(text)) {
    return {
      owner: 'Mick',
      cleaned: text.replace(/\bassign to mick\b|\bfor mick\b/gi, '').trim(),
    };
  }

  if (/\bassign to dale\b|\bfor dale\b/i.test(text)) {
    return {
      owner: 'Dale',
      cleaned: text.replace(/\bassign to dale\b|\bfor dale\b/gi, '').trim(),
    };
  }

  return { owner: fallbackOwner, cleaned: text.trim() };
}

function extractVoicePriority(text, fallbackPriority = 'Medium') {
  if (/\bhigh priority\b|\burgent\b/i.test(text)) {
    return {
      priority: 'High',
      cleaned: text.replace(/\bhigh priority\b|\burgent\b/gi, '').trim(),
    };
  }

  if (/\blow priority\b/i.test(text)) {
    return {
      priority: 'Low',
      cleaned: text.replace(/\blow priority\b/gi, '').trim(),
    };
  }

  if (/\bmedium priority\b/i.test(text)) {
    return {
      priority: 'Medium',
      cleaned: text.replace(/\bmedium priority\b/gi, '').trim(),
    };
  }

  return { priority: fallbackPriority, cleaned: text.trim() };
}

function cleanVoiceTitle(text) {
  return text.replace(/\s{2,}/g, ' ').replace(/^[-,:;]+|[-,:;]+$/g, '').trim();
}

function parseVoiceTask(transcript, options = {}) {
  const original = `${transcript || ''}`.trim();
  let working = original;

  const fallbackOwner = ALLOWED_OWNERS.has(options.owner) ? options.owner : 'Dale';
  const fallbackPriority = ALLOWED_PRIORITIES.has(options.priority) ? options.priority : 'Medium';

  const ownerInfo = extractVoiceOwner(working, fallbackOwner);
  working = ownerInfo.cleaned;

  const dateInfo = extractVoiceDate(working);
  working = dateInfo.cleaned;

  const priorityInfo = extractVoicePriority(working, fallbackPriority);
  working = priorityInfo.cleaned;

  const title = cleanVoiceTitle(working) || original;

  return {
    title,
    owner: ownerInfo.owner,
    due_date: dateInfo.due_date || '',
    priority: priorityInfo.priority,
    notes: options.extraNotes
      ? `${options.extraNotes}\n\nVoice note: ${original}`
      : `Voice note: ${original}`,
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getAuthToken(request, body) {
  const headerToken = request.headers.get('x-voice-task-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const bodyToken = typeof body.token === 'string' ? body.token : '';
  return headerToken || bodyToken;
}

function validateEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
  const token = process.env.VOICE_TASK_SECRET || '';

  if (!url) return { ok: false, message: 'Missing SUPABASE_URL environment variable.' };
  if (!key) return { ok: false, message: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.' };
  if (!token) return { ok: false, message: 'Missing VOICE_TASK_SECRET environment variable.' };

  return { ok: true, url, key, token };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function GET() {
  const env = validateEnv();
  return json(
    {
      ok: env.ok,
      route: '/api/quick-add-task',
      message: env.ok
        ? 'Quick voice task endpoint is ready. Send a POST with text and token.'
        : env.message,
      example: {
        text: 'Call Mick about the site tomorrow high priority',
        token: 'your-voice-task-secret',
      },
    },
    env.ok ? 200 : 500,
    corsHeaders()
  );
}

export async function POST(request) {
  const env = validateEnv();
  if (!env.ok) {
    return json({ ok: false, error: env.message }, 500, corsHeaders());
  }

  const body = await readJsonBody(request);
  const providedToken = getAuthToken(request, body);

  if (!providedToken || providedToken !== env.token) {
    return json({ ok: false, error: 'Unauthorized. Invalid or missing voice task token.' }, 401, corsHeaders());
  }

  const rawText = typeof body.text === 'string' ? body.text.trim() : '';
  if (!rawText) {
    return json({ ok: false, error: 'Missing text. Send a JSON body with a text field.' }, 400, corsHeaders());
  }

  const parsed = parseVoiceTask(rawText, {
    owner: typeof body.owner === 'string' ? body.owner : 'Dale',
    priority: typeof body.priority === 'string' ? body.priority : 'Medium',
    extraNotes: 'Added by quick voice capture',
  });

  const now = new Date().toISOString();
  const task = {
    id: safeRandomId(),
    workspace: WORKSPACE,
    title: parsed.title,
    owner: parsed.owner,
    status: 'To Do',
    priority: parsed.priority,
    due_date: parsed.due_date || null,
    notes: parsed.notes,
    created_at: now,
    updated_at: now,
  };

  try {
    const supabase = createClient(env.url, env.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.from('tasks').insert(task).select().single();
    if (error) {
      return json({ ok: false, error: error.message, details: error }, 500, corsHeaders());
    }

    return json(
      {
        ok: true,
        message: 'Task added.',
        task: data,
        parsed: {
          title: task.title,
          owner: task.owner,
          priority: task.priority,
          due_date: task.due_date,
        },
      },
      200,
      corsHeaders()
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: error?.message || 'Unexpected server error.',
      },
      500,
      corsHeaders()
    );
  }
}
