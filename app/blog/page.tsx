import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — NEX Mission Control",
  description: "Notas personales de ingeniería del proyecto NEX Mission Control.",
};

export default function BlogIndex() {
  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="mt-1.5 text-[15px] text-fog">
          Notas personales de ingeniería, escritas desde el proyecto.
        </p>
      </div>

      <ul className="mt-6 overflow-hidden rounded-lg border border-line-soft bg-panel">
        <li>
          <Link
            href="/blog/aprendizajes-ia-companero-ingenieria"
            className="group block px-5 py-5 transition-colors hover:bg-raised sm:px-6"
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-dim">
              APRENDIZAJES · HISTORIA PERSONAL · ±10 MIN
            </p>
            <span className="mt-1.5 block text-balance text-lg font-bold tracking-tight group-hover:underline group-hover:decoration-signal group-hover:decoration-2 group-hover:underline-offset-4">
              Cuando la IA se convirtió en mi compañero de ingeniería
            </span>
            <span className="mt-1.5 block text-[15px] leading-relaxed text-fog">
              De “haceme una app” a trabajar juntos.
            </span>
            <span
              aria-hidden
              className="mt-2 block font-mono text-sm text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-signal"
            >
              →
            </span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
