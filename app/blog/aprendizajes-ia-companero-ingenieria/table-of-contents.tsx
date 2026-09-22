"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; index: string; title: string };

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label="Recorrido del artículo">
      <p className="font-mono text-[11px] tracking-[0.18em] text-dim">
        RECORRIDO
      </p>
      <ol className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} className="shrink-0 lg:shrink">
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`flex items-baseline gap-2.5 rounded-md px-3 py-2 text-[13px] leading-snug transition-colors lg:border-l-2 lg:rounded-none lg:py-1.5 lg:pl-4 ${
                  isActive
                    ? "bg-raised text-paper lg:border-signal lg:bg-transparent"
                    : "text-fog hover:text-paper lg:border-transparent"
                }`}
              >
                <span
                  className={`font-mono text-[11px] tnum ${
                    isActive ? "text-signal" : "text-dim"
                  }`}
                >
                  {item.index}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">
                  {item.title}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
