import { describe, expect, it } from "vitest";
import { dueLabel, formatDate, getDaysLeft, sortTasks, validateSupabaseConfig, parseVoiceTask } from "./taskUtils.js";

describe("task utils", () => {
  it("formats empty date safely", () => {
    expect(formatDate("")).toBe("No due date");
  });

  it("returns null for missing due date", () => {
    expect(getDaysLeft("")).toBeNull();
  });

  it("returns Due today for today's date", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(dueLabel(today, "To Do")).toBe("Due today");
  });

  it("sorts priorities correctly", () => {
    const sorted = sortTasks([{ priority: "Low" }, { priority: "High" }, { priority: "Medium" }], "priority");
    expect(sorted.map((item) => item.priority)).toEqual(["High", "Medium", "Low"]);
  });

  it("rejects invalid Supabase URL", () => {
    expect(validateSupabaseConfig("http://example.com", "key").ok).toBe(false);
  });

  it("accepts valid-looking Supabase config", () => {
    expect(validateSupabaseConfig("https://example.supabase.co", "key").ok).toBe(true);
  });
});


describe("voice task parsing", () => {
  it("reads owner, date, and priority from speech", () => {
    const parsed = parseVoiceTask("Call supplier tomorrow assign to Mick urgent", {
      owner: "Dale",
      due_date: "",
      priority: "Medium",
      notes: ""
    });
    expect(parsed.owner).toBe("Mick");
    expect(parsed.priority).toBe("High");
    expect(parsed.due_date).toBeTruthy();
    expect(parsed.title.toLowerCase()).toContain("call supplier");
  });
});
