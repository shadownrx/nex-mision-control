import type { Metadata } from "next";
import Link from "next/link";

import ConsoleClock from "./console-clock";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEX Mission Control",
  description:
    "Single-user console for technical projects, their tasks, decisions, docs and activity.",
};

function Mark() {
  return (
    <span
      aria-hidden
      className="grid size-8 place-items-center rounded-md bg-signal font-mono text-sm font-bold text-void"
    >
      N
    </span>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-dvh flex-col">
          <header className="border-b border-line-soft">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5">
              <Link href="/" className="flex items-center gap-3">
                <Mark />
                <span className="leading-tight">
                  <span className="block text-[15px] font-bold tracking-tight">
                    NEX
                  </span>
                  <span className="block font-mono text-[11px] tracking-[0.18em] text-fog">
                    MISSION CONTROL
                  </span>
                </span>
              </Link>
              <nav className="ml-6 hidden items-center gap-1 sm:flex">
                <Link
                  href="/"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-paper hover:bg-raised"
                >
                  Projects
                </Link>
              </nav>
              <div className="ml-auto flex items-center gap-4">
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-fog">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-ok motion-safe:animate-blink"
                  />
                  LOCAL
                </span>
                <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
                <ConsoleClock />
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
            {children}
          </div>

          <footer className="border-t border-line-soft">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 font-mono text-[11px] tracking-[0.14em] text-dim">
              <span>NEX MISSION CONTROL</span>
              <span>SINGLE-USER BUILD</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
