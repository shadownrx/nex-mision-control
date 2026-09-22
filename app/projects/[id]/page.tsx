"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import type { Project } from "@/lib/projects/validation";
import type { Task } from "@/lib/tasks/validation";
import type { Decision } from "@/lib/decisions/validation";
import type { Documentation } from "@/lib/docs/validation";
import type { ActivityItem } from "@/lib/activity/derive";
import {
  deriveOverview,
  reviveOverviewInput,
  type ProjectOverview,
} from "@/lib/overview/derive";
import { entityAnchor } from "@/lib/overview/navigation";

export default function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [armingDelete, setArmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [newDecision, setNewDecision] = useState({
    title: "",
    context: "",
    alternatives: "",
    rationale: "",
    supersedes: "",
  });
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(
    null,
  );
  const [documents, setDocuments] = useState<Documentation[]>([]);
  const [newDoc, setNewDoc] = useState({ title: "", body: "" });
  const [docError, setDocError] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDoc, setEditDoc] = useState({ title: "", body: "" });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [editDecision, setEditDecision] = useState({
    title: "",
    context: "",
    alternatives: "",
    rationale: "",
  });

  useEffect(() => {
    void fetch(`/api/projects/${id}`).then(async (res) => {
      if (res.status === 404) {
        setMissing(true);
        setLoaded(true);
        return;
      }
      if (res.ok) {
        const p: Project = await res.json();
        setProject(p);
        setName(p.name);
        setDescription(p.description);
        const tasksRes = await fetch(`/api/projects/${id}/tasks`);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        const decisionsRes = await fetch(`/api/projects/${id}/decisions`);
        if (decisionsRes.ok) setDecisions(await decisionsRes.json());
        const docsRes = await fetch(`/api/projects/${id}/docs`);
        if (docsRes.ok) setDocuments(await docsRes.json());
        const activityRes = await fetch(`/api/projects/${id}/activity`);
        if (activityRes.ok) setActivity(await activityRes.json());
      }
      setLoaded(true);
    });
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        setError("Invalid project input");
        return;
      }
      setProject(await res.json());
      setSaved(true);
      await refreshActivity();
    } finally {
      setSaving(false);
    }
  }

  async function refreshActivity() {
    const res = await fetch(`/api/projects/${id}/activity`);
    if (res.ok) setActivity(await res.json());
  }

  async function refreshTasks() {
    const res = await fetch(`/api/projects/${id}/tasks`);
    if (res.ok) setTasks(await res.json());
    await refreshActivity();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setTaskError(null);
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (!res.ok) {
      setTaskError("Invalid task input");
      return;
    }
    setNewTitle("");
    await refreshTasks();
  }

  async function toggleTask(task: Task) {
    const res = await fetch(`/api/projects/${id}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: task.status === "open" ? "done" : "open",
      }),
    });
    if (res.ok) await refreshTasks();
  }

  async function saveTaskTitle(taskId: string) {
    setTaskError(null);
    const res = await fetch(`/api/projects/${id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });
    if (!res.ok) {
      setTaskError("Invalid task input");
      return;
    }
    setEditingId(null);
    await refreshTasks();
  }

  async function removeTask(taskId: string) {
    const res = await fetch(`/api/projects/${id}/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (res.ok) await refreshTasks();
  }

  async function refreshDecisions() {
    const res = await fetch(`/api/projects/${id}/decisions`);
    if (res.ok) setDecisions(await res.json());
    await refreshActivity();
  }

  async function addDecision(e: React.FormEvent) {
    e.preventDefault();
    setDecisionError(null);
    const body: Record<string, string> = {
      title: newDecision.title,
      context: newDecision.context,
      alternatives: newDecision.alternatives,
      rationale: newDecision.rationale,
    };
    if (newDecision.supersedes) body.supersedes = newDecision.supersedes;
    const res = await fetch(`/api/projects/${id}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setDecisionError(
        res.status === 404
          ? "Project not found"
          : "Invalid decision input (check the superseded decision)",
      );
      return;
    }
    setNewDecision({
      title: "",
      context: "",
      alternatives: "",
      rationale: "",
      supersedes: "",
    });
    await refreshDecisions();
  }

  async function saveDecision(decisionId: string) {
    setDecisionError(null);
    const res = await fetch(`/api/projects/${id}/decisions/${decisionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDecision),
    });
    if (!res.ok) {
      setDecisionError(
        res.status === 409
          ? "Superseded decisions are immutable"
          : "Invalid decision input",
      );
      return;
    }
    setEditingDecisionId(null);
    await refreshDecisions();
  }

  async function removeDecision(decisionId: string) {
    setDecisionError(null);
    const res = await fetch(`/api/projects/${id}/decisions/${decisionId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setDecisionError(
        res.status === 409
          ? "Linked history cannot be deleted"
          : "Could not delete decision",
      );
      return;
    }
    await refreshDecisions();
  }

  function decisionTitle(decisionId: string | null): string {
    if (!decisionId) return "";
    return (
      decisions.find((d) => d.id === decisionId)?.title ?? decisionId.slice(0, 8)
    );
  }

  function replacedLinks(decisionId: string): { id: string; title: string }[] {
    return decisions
      .filter((d) => d.supersededBy === decisionId)
      .map((d) => ({ id: d.id, title: d.title }));
  }

  async function refreshDocs() {
    const res = await fetch(`/api/projects/${id}/docs`);
    if (res.ok) setDocuments(await res.json());
    await refreshActivity();
  }

  async function addDoc(e: React.FormEvent) {
    e.preventDefault();
    setDocError(null);
    const res = await fetch(`/api/projects/${id}/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDoc),
    });
    if (!res.ok) {
      setDocError("Invalid documentation input");
      return;
    }
    setNewDoc({ title: "", body: "" });
    await refreshDocs();
  }

  async function saveDoc(docId: string) {
    setDocError(null);
    const res = await fetch(`/api/projects/${id}/docs/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDoc),
    });
    if (!res.ok) {
      setDocError("Invalid documentation input");
      return;
    }
    setEditingDocId(null);
    await refreshDocs();
  }

  async function removeDoc(docId: string) {
    const res = await fetch(`/api/projects/${id}/docs/${docId}`, {
      method: "DELETE",
    });
    if (res.ok) await refreshDocs();
  }

  async function remove() {
    if (!armingDelete) {
      setArmingDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  const overview: ProjectOverview = useMemo(
    () =>
      deriveOverview(
        reviveOverviewInput({ tasks, decisions, documents, activity }),
      ),
    [tasks, decisions, documents, activity],
  );

  if (missing)
    return (
      <main>
        <Link
          href="/"
          className="font-mono text-sm text-fog hover:text-signal hover:underline hover:underline-offset-4"
        >
          ← Projects
        </Link>
        <div className="mt-6 rounded-lg border border-dashed border-line px-5 py-12 text-center">
          <p className="text-lg font-bold">Project not found</p>
          <p className="mt-1 text-sm text-fog">
            This project does not exist or was deleted.
          </p>
        </div>
      </main>
    );

  if (!loaded || !project)
    return (
      <main>
        <div className="h-4 w-28 rounded bg-raised" aria-hidden />
        <div className="mt-4 h-9 w-2/3 rounded-md bg-raised" aria-hidden />
        <div className="mt-2 h-4 w-1/2 rounded bg-raised" aria-hidden />
        <p className="mt-6 font-mono text-sm text-fog">Loading…</p>
      </main>
    );

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="font-mono text-sm text-fog hover:text-signal hover:underline hover:underline-offset-4"
        >
          ← Projects
        </Link>
        <span className="font-mono text-xs text-dim tnum">ID {project.id}</span>
      </div>

      <div id="project" className="mt-4 flex items-start gap-4">
        <span
          aria-hidden
          className="mt-2 size-2.5 shrink-0 rounded-full bg-ok"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1.5 max-w-2xl text-[15px] text-fog">
            {project.description || "No description"}
          </p>
        </div>
      </div>

      <section
        aria-label="Project overview"
        className="mt-8 rounded-lg border border-line-soft bg-panel p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">Project overview</h2>
          <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
            OVERVIEW — DERIVED
          </span>
        </div>
        <p className="mt-1.5 text-sm text-fog">
          Derived live from the project and its content. Counts and
          timestamps only.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-line-soft bg-void px-3.5 py-2.5">
            <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
              OPEN TASKS
            </dt>
            <dd className="mt-0.5 text-lg font-bold tnum">
              {overview.signals.openTasks}
            </dd>
          </div>
          <div className="rounded-md border border-line-soft bg-void px-3.5 py-2.5">
            <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
              CLOSED TASKS
            </dt>
            <dd className="mt-0.5 text-lg font-bold tnum">
              {overview.signals.closedTasks}
            </dd>
          </div>
          <div className="rounded-md border border-line-soft bg-void px-3.5 py-2.5">
            <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
              ACTIVE DECISIONS
            </dt>
            <dd className="mt-0.5 text-lg font-bold tnum">
              {overview.signals.activeDecisions}
            </dd>
          </div>
          <div className="rounded-md border border-line-soft bg-void px-3.5 py-2.5">
            <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
              SUPERSEDED DECISIONS
            </dt>
            <dd className="mt-0.5 text-lg font-bold tnum">
              {overview.signals.supersededDecisions}
            </dd>
          </div>
          <div className="rounded-md border border-line-soft bg-void px-3.5 py-2.5">
            <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
              DOCUMENTS
            </dt>
            <dd className="mt-0.5 text-lg font-bold tnum">
              {overview.signals.documents}
            </dd>
          </div>
          <div className="rounded-md border border-line-soft bg-void px-3.5 py-2.5">
            <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
              LAST CHANGE
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-paper">
              {overview.signals.lastActivity
                ? overview.signals.lastActivity.toLocaleString()
                : "No activity yet."}
            </dd>
          </div>
        </dl>
        <h3 className="mt-6 text-sm font-bold tracking-tight">
          Current direction
        </h3>
        <p className="mt-1 text-sm text-fog">
          Active decisions, most recently updated.
        </p>
        {overview.direction.length === 0 ? (
          <p className="mt-3 text-sm text-fog">
            {overview.signals.supersededDecisions > 0
              ? "No active decisions — everything has been superseded."
              : "No active decisions."}
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {overview.direction.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md border border-line-soft bg-void px-3.5 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-paper">
                  {d.title}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-fog">
                  {d.updatedAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        {overview.signals.activeDecisions > overview.direction.length && (
          <p className="mt-2 text-sm text-fog">
            Showing {overview.direction.length} of{" "}
            {overview.signals.activeDecisions} — the rest are listed under
            Technical decisions.
          </p>
        )}
        <h3 className="mt-6 text-sm font-bold tracking-tight">
          Recent evolution
        </h3>
        <p className="mt-1 text-sm text-fog">
          One entry per record: its creation plus its latest derivable change.
        </p>
        {overview.evolution.length === 0 ? (
          <p className="mt-3 text-sm text-fog">No activity yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {overview.evolution.map((episode) => (
              <li
                key={`${episode.kind}-${episode.id}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md border border-line-soft bg-void px-3.5 py-2.5"
              >
                <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
                  {episode.kind.toUpperCase()} ·{" "}
                  {episode.latestEvent.toUpperCase()}
                </span>
                <a
                  href={entityAnchor(episode.kind, episode.id)}
                  className="min-w-0 flex-1 truncate text-sm text-paper hover:text-signal hover:underline hover:underline-offset-4"
                >
                  {episode.title}
                </a>
                <span className="shrink-0 font-mono text-[11px] text-fog">
                  {episode.latestAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        {overview.supersessions.length > 0 && (
          <>
            <h3 className="mt-6 text-sm font-bold tracking-tight">
              Supersessions
            </h3>
            <ul className="mt-3 grid gap-2">
              {overview.supersessions.map((pair) => (
                <li
                  key={`${pair.fromId}-${pair.toId}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md border border-line-soft bg-void px-3.5 py-2.5"
                >
                  <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
                    SUPERSEDED BY
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-paper">
                    <a
                      href={entityAnchor("decision", pair.fromId)}
                      className="hover:text-signal hover:underline hover:underline-offset-4"
                    >
                      {pair.fromTitle}
                    </a>{" "}
                    →{" "}
                    <a
                      href={entityAnchor("decision", pair.toId)}
                      className="hover:text-signal hover:underline hover:underline-offset-4"
                    >
                      {pair.toTitle}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section
        aria-label="Tasks"
        className="mt-8 rounded-lg border border-line-soft bg-panel p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">Tasks</h2>
          <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
            03 — TASKS
          </span>
        </div>
        <form onSubmit={addTask} className="mt-4 flex gap-2.5">
          <input
            aria-label="New task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task title"
            className="min-w-0 flex-1 rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-signal px-5 py-2.5 text-sm font-bold text-void transition-colors hover:bg-paper"
          >
            Add
          </button>
        </form>
        {taskError && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
          >
            {taskError}
          </p>
        )}
        <ul className="mt-4 grid gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              id={`task-${task.id}`}
              className="flex items-center gap-3 rounded-md border border-line-soft bg-void px-3.5 py-2.5"
            >
              <button
                onClick={() => toggleTask(task)}
                aria-label={
                  task.status === "open"
                    ? `Mark "${task.title}" done`
                    : `Reopen "${task.title}"`
                }
                aria-pressed={task.status === "done"}
                className={
                  task.status === "done"
                    ? "size-5 shrink-0 rounded-full bg-ok font-mono text-[11px] font-bold text-void"
                    : "size-5 shrink-0 rounded-full border border-line"
                }
              >
                {task.status === "done" ? "✓" : ""}
              </button>
              {editingId === task.id ? (
                <>
                  <input
                    aria-label="Task title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-line bg-void px-2.5 py-1.5 text-sm text-paper outline-none focus:border-signal"
                  />
                  <button
                    onClick={() => saveTaskTitle(task.id)}
                    className="shrink-0 font-mono text-xs font-bold text-signal hover:text-paper"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="shrink-0 font-mono text-xs text-fog hover:text-paper"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={
                      task.status === "done"
                        ? "min-w-0 flex-1 truncate text-sm text-dim line-through"
                        : "min-w-0 flex-1 truncate text-sm text-paper"
                    }
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(task.id);
                      setEditTitle(task.title);
                    }}
                    className="shrink-0 font-mono text-xs text-fog hover:text-paper"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeTask(task.id)}
                    aria-label={`Delete "${task.title}"`}
                    className="shrink-0 font-mono text-xs text-fog hover:text-danger"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        {tasks.length === 0 && (
          <p className="mt-4 text-sm text-fog">No tasks yet.</p>
        )}
      </section>

      <section
        aria-label="Technical decisions"
        className="mt-8 rounded-lg border border-line-soft bg-panel p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">
            Technical decisions
          </h2>
          <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
            04 — DECISIONS
          </span>
        </div>
        <form onSubmit={addDecision} className="mt-4 grid gap-3">
          <input
            aria-label="Decision title"
            value={newDecision.title}
            onChange={(e) =>
              setNewDecision({ ...newDecision, title: e.target.value })
            }
            placeholder="Decision title"
            className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
          />
          <textarea
            aria-label="Context"
            value={newDecision.context}
            onChange={(e) =>
              setNewDecision({ ...newDecision, context: e.target.value })
            }
            placeholder="Context: what situation led to this choice?"
            rows={2}
            className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
          />
          <textarea
            aria-label="Considered alternatives"
            value={newDecision.alternatives}
            onChange={(e) =>
              setNewDecision({ ...newDecision, alternatives: e.target.value })
            }
            placeholder="Considered alternatives"
            rows={2}
            className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
          />
          <textarea
            aria-label="Rationale"
            value={newDecision.rationale}
            onChange={(e) =>
              setNewDecision({ ...newDecision, rationale: e.target.value })
            }
            placeholder="Rationale: why this option?"
            rows={2}
            className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <label
              htmlFor="supersedes"
              className="text-sm font-medium text-fog"
            >
              Supersedes
            </label>
            <select
              id="supersedes"
              value={newDecision.supersedes}
              onChange={(e) =>
                setNewDecision({ ...newDecision, supersedes: e.target.value })
              }
              className="min-w-0 flex-1 rounded-md border border-line bg-void px-3 py-2.5 text-sm text-paper outline-none focus:border-signal"
            >
              <option value="">None — new decision</option>
              {decisions
                .filter((d) => d.status === "active")
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-md bg-signal px-5 py-2.5 text-sm font-bold text-void transition-colors hover:bg-paper"
            >
              Record
            </button>
          </div>
        </form>
        {decisionError && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
          >
            {decisionError}
          </p>
        )}
        <ul className="mt-4 grid gap-3">
          {decisions.map((decision) => (
            <li
              key={decision.id}
              id={`decision-${decision.id}`}
              className="rounded-md border border-line-soft bg-void px-4 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="min-w-0 flex-1 text-[15px] font-bold">
                  {decision.title}
                </span>
                <span
                  className={
                    decision.status === "active"
                      ? "rounded-full bg-ok/15 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-ok"
                      : "rounded-full bg-raised px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-fog"
                  }
                >
                  {decision.status === "active" ? (
                    "ACTIVE"
                  ) : (
                    <>
                      SUPERSEDED BY{" "}
                      <a
                        href={
                          decision.supersededBy
                            ? entityAnchor("decision", decision.supersededBy)
                            : undefined
                        }
                        className="hover:text-signal hover:underline hover:underline-offset-4"
                      >
                        {decisionTitle(
                          decision.supersededBy,
                        ).toUpperCase()}
                      </a>
                    </>
                  )}
                </span>
              </div>
              {replacedLinks(decision.id).map((link) => (
                <p
                  key={link.id}
                  className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-dim"
                >
                  SUPERSEDES{" "}
                  <a
                    href={entityAnchor("decision", link.id)}
                    className="hover:text-signal hover:underline hover:underline-offset-4"
                  >
                    {link.title.toUpperCase()}
                  </a>
                </p>
              ))}
              {editingDecisionId === decision.id ? (
                <div className="mt-3 grid gap-2.5">
                  <input
                    aria-label="Decision title"
                    value={editDecision.title}
                    onChange={(e) =>
                      setEditDecision({ ...editDecision, title: e.target.value })
                    }
                    className="rounded-md border border-line bg-void px-2.5 py-1.5 text-sm text-paper outline-none focus:border-signal"
                  />
                  <textarea
                    aria-label="Context"
                    value={editDecision.context}
                    onChange={(e) =>
                      setEditDecision({
                        ...editDecision,
                        context: e.target.value,
                      })
                    }
                    rows={2}
                    className="rounded-md border border-line bg-void px-2.5 py-1.5 text-sm text-paper outline-none focus:border-signal"
                  />
                  <textarea
                    aria-label="Considered alternatives"
                    value={editDecision.alternatives}
                    onChange={(e) =>
                      setEditDecision({
                        ...editDecision,
                        alternatives: e.target.value,
                      })
                    }
                    rows={2}
                    className="rounded-md border border-line bg-void px-2.5 py-1.5 text-sm text-paper outline-none focus:border-signal"
                  />
                  <textarea
                    aria-label="Rationale"
                    value={editDecision.rationale}
                    onChange={(e) =>
                      setEditDecision({
                        ...editDecision,
                        rationale: e.target.value,
                      })
                    }
                    rows={2}
                    className="rounded-md border border-line bg-void px-2.5 py-1.5 text-sm text-paper outline-none focus:border-signal"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveDecision(decision.id)}
                      className="shrink-0 font-mono text-xs font-bold text-signal hover:text-paper"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDecisionId(null)}
                      className="shrink-0 font-mono text-xs text-fog hover:text-paper"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div>
                      <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
                        CONTEXT
                      </dt>
                      <dd className="mt-0.5 text-fog">{decision.context}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
                        ALTERNATIVES
                      </dt>
                      <dd className="mt-0.5 text-fog">
                        {decision.alternatives}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] tracking-[0.14em] text-dim">
                        RATIONALE
                      </dt>
                      <dd className="mt-0.5 text-fog">{decision.rationale}</dd>
                    </div>
                  </dl>
                  {decision.status === "active" && (
                    <div className="mt-3 flex flex-wrap gap-4">
                      <button
                        onClick={() => {
                          setEditingDecisionId(decision.id);
                          setEditDecision({
                            title: decision.title,
                            context: decision.context,
                            alternatives: decision.alternatives,
                            rationale: decision.rationale,
                          });
                        }}
                        className="shrink-0 font-mono text-xs text-fog hover:text-paper"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setNewDecision({ ...newDecision, supersedes: decision.id })
                        }
                        className="shrink-0 font-mono text-xs text-fog hover:text-paper"
                      >
                        Supersede
                      </button>
                      <button
                        onClick={() => removeDecision(decision.id)}
                        className="shrink-0 font-mono text-xs text-fog hover:text-danger"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
        {decisions.length === 0 && (
          <p className="mt-4 text-sm text-fog">No decisions recorded yet.</p>
        )}
      </section>

      <section
        aria-label="Documentation"
        className="mt-8 rounded-lg border border-line-soft bg-panel p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">Documentation</h2>
          <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
            05 — DOCS
          </span>
        </div>
        <form onSubmit={addDoc} className="mt-4 grid gap-3">
          <input
            aria-label="Document title"
            value={newDoc.title}
            onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
            placeholder="Document title"
            className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
          />
          <textarea
            aria-label="Document body"
            value={newDoc.body}
            onChange={(e) => setNewDoc({ ...newDoc, body: e.target.value })}
            placeholder="Write the explanation here"
            rows={3}
            className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
          />
          <div>
            <button
              type="submit"
              className="rounded-md bg-signal px-5 py-2.5 text-sm font-bold text-void transition-colors hover:bg-paper"
            >
              Add
            </button>
          </div>
        </form>
        {docError && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
          >
            {docError}
          </p>
        )}
        <ul className="mt-4 grid gap-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              id={`doc-${doc.id}`}
              className="rounded-md border border-line-soft bg-void px-4 py-3.5"
            >
              {editingDocId === doc.id ? (
                <div className="grid gap-2.5">
                  <input
                    aria-label="Document title"
                    value={editDoc.title}
                    onChange={(e) =>
                      setEditDoc({ ...editDoc, title: e.target.value })
                    }
                    className="rounded-md border border-line bg-void px-2.5 py-1.5 text-sm text-paper outline-none focus:border-signal"
                  />
                  <textarea
                    aria-label="Document body"
                    value={editDoc.body}
                    onChange={(e) =>
                      setEditDoc({ ...editDoc, body: e.target.value })
                    }
                    rows={3}
                    className="rounded-md border border-line bg-void px-2.5 py-1.5 text-sm text-paper outline-none focus:border-signal"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveDoc(doc.id)}
                      className="shrink-0 font-mono text-xs font-bold text-signal hover:text-paper"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDocId(null)}
                      className="shrink-0 font-mono text-xs text-fog hover:text-paper"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[15px] font-bold">{doc.title}</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fog">
                    {doc.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        setEditingDocId(doc.id);
                        setEditDoc({ title: doc.title, body: doc.body });
                      }}
                      className="shrink-0 font-mono text-xs text-fog hover:text-paper"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeDoc(doc.id)}
                      className="shrink-0 font-mono text-xs text-fog hover:text-danger"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {documents.length === 0 && (
          <p className="mt-4 text-sm text-fog">No documentation yet.</p>
        )}
      </section>

      <section
        aria-label="Activity"
        className="mt-8 rounded-lg border border-line-soft bg-panel p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">Activity</h2>
          <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
            07 — DERIVED
          </span>
        </div>
        <p className="mt-1.5 text-sm text-fog">
          Derived live from the project and its content. Read-only: nothing
          here can be created, edited, or deleted.
        </p>
        <ul className="mt-4 grid gap-2">
          {activity.map((item) => (
            <li
              key={`${item.kind}-${item.id}-${item.event}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md border border-line-soft bg-void px-3.5 py-2.5"
            >
              <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
                {item.kind.toUpperCase()} · {item.event.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-paper">
                {item.title}
              </span>
              <time
                dateTime={new Date(item.occurredAt).toISOString()}
                className="shrink-0 font-mono text-[11px] text-fog"
              >
                {new Date(item.occurredAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
        {activity.length === 0 && (
          <p className="mt-4 text-sm text-fog">No activity yet.</p>
        )}
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-5">
        <section
          aria-label="Edit project"
          className="rounded-lg border border-line-soft bg-panel p-5 sm:p-6 lg:col-span-3"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight">Edit project</h2>
            <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
              02 — UPDATE
            </span>
          </div>
          <form onSubmit={save} className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="edit-name" className="text-sm font-medium text-fog">
                Name
              </label>
              <input
                id="edit-name"
                aria-label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="edit-description"
                className="text-sm font-medium text-fog"
              >
                Description
              </label>
              <input
                id="edit-description"
                aria-label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-signal px-5 py-2.5 text-sm font-bold text-void transition-colors hover:bg-paper disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {saved && !error && (
                <span className="font-mono text-xs tracking-wider text-ok">
                  SAVED
                </span>
              )}
            </div>
          </form>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}
        </section>

        <section
          aria-label="Delete project"
          className="rounded-lg border border-danger/30 bg-panel p-5 sm:p-6 lg:col-span-2"
        >
          <h2 className="text-lg font-bold tracking-tight text-danger">
            Delete project
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-fog">
            {armingDelete
              ? "This cannot be undone. Press confirm to permanently remove this project."
              : "Removing a project is permanent. You will be asked to confirm."}
          </p>
          <button
            onClick={remove}
            disabled={deleting}
            className={
              armingDelete
                ? "mt-4 rounded-md bg-danger px-5 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
                : "mt-4 rounded-md border border-danger/50 px-5 py-2.5 text-sm font-bold text-danger transition-colors hover:bg-danger hover:text-void disabled:cursor-wait disabled:opacity-60"
            }
          >
            {deleting ? "Deleting…" : armingDelete ? "Confirm delete" : "Delete"}
          </button>
        </section>
      </div>
    </main>
  );
}
