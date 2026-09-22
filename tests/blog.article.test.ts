import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MD_PATH = "docs/blog/aprendizajes-ia-companero-ingenieria.md";
const PAGE_PATH =
  "app/blog/aprendizajes-ia-companero-ingenieria/page.tsx";

const md = readFileSync(MD_PATH, "utf8");
const page = readFileSync(PAGE_PATH, "utf8");

describe("blog article fidelity", () => {
  it("keeps the original H1 title", () => {
    const h1 = md.match(/^#\s+(.+)$/m)?.[1]?.trim();
    expect(h1).toBeTruthy();
    expect(page).toContain(h1!);
  });

  it("keeps every ## section heading", () => {
    const headings = [...md.matchAll(/^##\s+(.+)$/gm)].map((m) =>
      m[1]!.trim(),
    );
    expect(headings.length).toBe(12);
    for (const heading of headings) {
      expect(page, `missing section: ${heading}`).toContain(heading);
    }
  });

  it("has no ### sub-sections", () => {
    const subheadings = [...md.matchAll(/^###\s+(.+)$/gm)];
    expect(subheadings).toEqual([]);
  });

  it("keeps every blockquote statement", () => {
    const quotes = [
      "“Construime una app.”",
      "“Quiero esto.”",
      "“Hacelo como vos puedas.”",
      "“Quiero música electrónica que suene como Avicii.”",
      "“Esto también era lo que necesitaba. ¿Por qué no aprendí esto antes?”",
      "“¿Cómo hago algo suficientemente poderoso sin terminar destruyendo la computadora del usuario?”",
      "“Che, esto que estás planteando quizás no sea la mejor solución.”",
      "“Me gusta lo que proponés, pero podemos ver de implementar ambas soluciones quizás producimos algo mejor.”",
      "“Creá un sistema para diez personas.”",
      "“¿Qué pasa si mañana explota esto?”",
      "“Ah, para esto no pensé.”",
      "“Aprendí a darle mejores instrucciones a la IA.”",
      "“Haceme una app.”",
      "“Construí esto.”",
      "“Sos un desarrollador.”",
    ];
    for (const quote of quotes) {
      expect(page, `missing quote: ${quote}`).toContain(quote);
    }
  });

  it("keeps the Skills list", () => {
    for (const skill of [
      "/domain-modeling",
      "/to-spec",
      "/to-tickets",
      "/implement",
      "/tdd",
      "/code-review",
      "/ask-matt",
      "/grill-with-docs",
    ]) {
      expect(page, `missing skill: ${skill}`).toContain(skill);
    }
  });

  it("keeps the key personal statements", () => {
    for (const line of [
      "no era culpa de la IA",
      "demasiada información",
      "la información correcta",
      "WTF.",
      "compañero de ingeniería",
      "no mirar un problema desde un solo lado.",
      "por dónde empezar",
      "deje de ser tu enemigo",
      "se convierta en",
      "tu aliado",
      "No se trata solamente de hacer que la IA haga más cosas.",
    ]) {
      expect(page, `missing statement: ${line}`).toContain(line);
    }
  });

  it("shows the author byline", () => {
    expect(page).toContain("Salvador Juarez");
    expect(page).toContain("2026");
  });

  it("has one navigable anchor per section", () => {
    const anchors = [...page.matchAll(/id="([a-z0-9-]+)"/g)].map((m) => m[1]);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(anchors.length).toBeGreaterThanOrEqual(12);
  });

  it("contains no leftovers from the previous version", () => {
    for (const leftover of [
      "S2-06",
      "No tocar el código",
      "superseded",
      "fileParallelism",
      "No agregar nuevos endpoints",
    ]) {
      expect(page, `leftover found: ${leftover}`).not.toContain(leftover);
    }
  });

  it("avoids corporate filler phrases", () => {
    for (const phrase of [
      "En el mundo actual",
      "está revolucionando",
      "En este artículo aprenderás",
    ]) {
      expect(page, `corporate filler found: ${phrase}`).not.toContain(phrase);
    }
  });
});
