import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Plus,
  Clock,
  CheckCircle2,
  Zap
} from "lucide-react";
import { classNames, formatDate } from "../lib/taskUtils.js";

const ownerColors = {
  Dale: "bg-sky-100 text-sky-700",
  Mick: "bg-amber-100 text-amber-700",
  Mark: "bg-green-100 text-green-700",
  Unassigned: "bg-slate-100 text-slate-700"
};

export default function Capture({ onVoiceTaskStart, recentTasks, onTaskClick, onNewTask }) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

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
      setTranscript("");
      const recognition = new SpeechRecognition();
      recognition.lang = "en-GB";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError("");
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + transcriptSegment);
          } else {
            interimTranscript += transcriptSegment;
          }
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
          setVoiceError("No speech was detected. Try again.");
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

  return (
    <div className="min-h-screen bg-slate-100 pb-24 sm:pb-0">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Capture</h1>
          <p className="mt-2 text-slate-600">Quick task entry and voice capture</p>
        </div>

        {/* Voice Task Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl"
        >
          <div className="mb-6">
            <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3">
              <Mic className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Voice Task</h2>
            <p className="mt-2 text-slate-300">
              Speak naturally. "Call Mark tomorrow, high priority" or "Meeting at 2pm Friday"
            </p>
          </div>

          {voiceSupported ? (
            <div className="space-y-4">
              <button
                onClick={toggleVoiceInput}
                className={classNames(
                  "w-full rounded-2xl px-6 py-4 text-lg font-semibold transition flex items-center justify-center gap-3",
                  isListening
                    ? "bg-rose-500 hover:bg-rose-600 animate-pulse"
                    : "bg-white text-slate-900 hover:bg-slate-100"
                )}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    Stop listening
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Start voice input
                  </>
                )}
              </button>

              {transcript && (
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-sm text-slate-300 mb-1">Captured:</p>
                  <p className="text-base text-white">{transcript}</p>
                </div>
              )}

              {voiceError && (
                <div className="rounded-xl bg-rose-500/20 border border-rose-500 p-4">
                  <p className="text-sm text-rose-200">{voiceError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-white/10 p-4 text-center">
              <p className="text-sm text-slate-300">
                Voice entry is not supported in this browser. Use the Quick Add button instead.
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick Add Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-[28px] border-2 border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="mb-6">
            <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">
              <Plus className="h-6 w-6 text-slate-900" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Quick Add</h2>
            <p className="mt-2 text-slate-600">
              Type a task directly or use the full form for more details
            </p>
          </div>

          <button
            onClick={onNewTask}
            className="w-full rounded-2xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 flex items-center justify-center gap-3"
          >
            <Plus className="h-5 w-5" />
            Create new task
          </button>
        </motion.div>

        {/* Recent Tasks */}
        {recentTasks && recentTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="mb-4 text-lg font-bold text-slate-900">Recent captures</h2>
            <div className="space-y-3">
              {recentTasks.slice(0, 5).map((task) => (
                <motion.button
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  layout
                  className="w-full text-left"
                >
                  <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{task.title}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          {task.due_date && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </span>
                          )}
                          {task.status === "Done" && (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={classNames("rounded-full px-3 py-1 text-xs font-medium", ownerColors[task.owner] || ownerColors.Unassigned)}>
                        {task.owner}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[28px] border border-slate-200 bg-white p-6"
        >
          <h3 className="mb-4 font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Tips for fast capture
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">1</span>
              <span>"Follow up with Mark" creates a task assigned to Mark</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">2</span>
              <span>"Tomorrow, high priority" sets the due date and priority</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">3</span>
              <span>"Meeting at 2pm" captures the time automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">4</span>
              <span>Your recent captures appear below for quick access</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
