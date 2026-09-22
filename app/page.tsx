"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Project } from "@/lib/projects/validation";
import {
  deriveOverview,
  reviveOverviewInput,
} from "@/lib/overview/derive";

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [signals, setSignals] = useState<
    Record<string, { openTasks: number; lastActivity: Date | null }>
  >({});

  async function refresh() {
    const res = await fetch("/api/projects");
    if (!res.ok) {
      setLoaded(true);
      return;
    }
    const list: Project[] = await res.json();
    setProjects(list);
    setLoaded(true);
    // Per-project signals through the same ProjectOverview derivation
    // (empty decisions/documents do not feed openTasks/lastActivity).
    // N+1 against existing endpoints; failures fall back to empty reads.
    const entries = await Promise.all(
      list.map(async (p) => {
        const [tasksRes, activityRes] = await Promise.all([
          fetch(`/api/projects/${p.id}/tasks`),
          fetch(`/api/projects/${p.id}/activity`),
        ]);
        const overview = deriveOverview(
          reviveOverviewInput({
            tasks: tasksRes.ok ? await tasksRes.json() : [],
            decisions: [],
            documents: [],
            activity: activityRes.ok ? await activityRes.json() : [],
          }),
        );
        return [
          p.id,
          {
            openTasks: overview.signals.openTasks,
            lastActivity: overview.signals.lastActivity,
          },
        ] as const;
      }),
    );
    setSignals(Object.fromEntries(entries));
  }

  useEffect(() => {
    void refresh();
  }, []);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [projects, filter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        setError("Invalid project input");
        return;
      }
      setName("");
      setDescription("");
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1.5 text-[15px] text-fog">
            Every technical undertaking you own, tracked from one console.
          </p>
        </div>
        <p className="rounded-full border border-line bg-panel px-3.5 py-1.5 font-mono text-xs tracking-wider text-fog tnum">
          {loaded ? (
            <>
              <span className="font-bold text-paper">{projects.length}</span>{" "}
              {projects.length === 1 ? "PROJECT" : "PROJECTS"}
            </>
          ) : (
            "LOADING…"
          )}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label htmlFor="filter" className="sr-only">
          Filter projects
        </label>
        <input
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter projects…"
          className="w-full max-w-sm rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
        />
      </div>

      <section aria-label="Project list" className="mt-4">
        {!loaded ? (
          <div className="rounded-lg border border-line-soft bg-panel p-5">
            <p className="font-mono text-sm text-fog">Loading…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-panel px-5 py-10 text-center">
            <p className="text-[15px] font-semibold">
              {projects.length === 0
                ? "No projects yet"
                : "No projects match this filter"}
            </p>
            <p className="mt-1 text-sm text-fog">
              {projects.length === 0
                ? "Create your first project below to start tracking work."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line-soft bg-panel">
            {visible.map((p, i) => {
              const sig = signals[p.id];
              const signalLine = !sig
                ? "…"
                : `${sig.openTasks} OPEN · ${
                    sig.lastActivity
                      ? `LAST CHANGE ${sig.lastActivity.toLocaleDateString()}`
                      : "NO ACTIVITY YET"
                  }`;
              return (
              <li
                key={p.id}
                className={i > 0 ? "border-t border-line-soft" : undefined}
              >
                <Link
                  href={`/projects/${p.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-raised"
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full bg-ok"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold group-hover:underline group-hover:decoration-signal group-hover:decoration-2 group-hover:underline-offset-4">
                      {p.name}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-fog">
                      {p.description || "No description"}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-xs text-dim tnum">
                      {signalLine}
                    </span>
                  </span>
                  <span className="hidden shrink-0 font-mono text-xs text-dim tnum sm:block">
                    {shortId(p.id)}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 font-mono text-sm text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-signal"
                  >
                    →
                  </span>
                </Link>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        aria-label="New project"
        className="mt-8 rounded-lg border border-line-soft bg-panel p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">New project</h2>
          <span className="font-mono text-[11px] tracking-[0.14em] text-dim">
            01 — CREATE
          </span>
        </div>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="new-name" className="text-sm font-medium text-fog">
              Name
            </label>
            <input
              id="new-name"
              aria-label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="new-description"
              className="text-sm font-medium text-fog"
            >
              Description
            </label>
            <input
              id="new-description"
              aria-label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="rounded-md border border-line bg-void px-3.5 py-2.5 text-sm text-paper outline-none placeholder:text-dim focus:border-signal"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-signal px-5 py-2.5 text-sm font-bold text-void transition-colors hover:bg-paper disabled:cursor-wait disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
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
    </main>
  );
}
