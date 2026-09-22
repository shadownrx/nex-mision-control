import type { Metadata } from "next";
import Link from "next/link";

import ReadingProgress from "./reading-progress";
import Reveal from "./reveal";
import TableOfContents, { type TocItem } from "./table-of-contents";

export const metadata: Metadata = {
  title: "Cuando la IA se convirtió en mi compañero de ingeniería",
  description:
    "Historia personal de un desarrollador: de decirle a la IA “haceme una app” a convertirla en parte de su proceso de ingeniería.",
  authors: [{ name: "Salvador Juarez" }],
};

const SECTIONS: TocItem[] = [
  { id: "el-problema-no-era-la-ia", index: "01", title: "El problema no era la IA" },
  { id: "de-prompts-al-contexto", index: "02", title: "De los prompts al contexto" },
  { id: "cuando-descubri-los-skills", index: "03", title: "Cuando descubrí los Skills" },
  { id: "domain-modeling", index: "04", title: "Domain Modeling" },
  { id: "idea-grande-dividirse", index: "05", title: "Una idea grande empieza a dividirse" },
  { id: "cuando-la-ia-te-contradice", index: "06", title: "Cuando la IA te contradice" },
  { id: "y-si-manana-explota", index: "07", title: "¿Y si mañana explota esto?" },
  { id: "companero-de-ingenieria", index: "08", title: "La IA como compañero de ingeniería" },
  { id: "tambien-aprendi-yo", index: "09", title: "También aprendí yo" },
  { id: "dominar-la-ia", index: "10", title: "Entonces, ¿qué significa dominar la IA?" },
  { id: "recien-empieza", index: "11", title: "Lo que le diría a alguien que recién empieza" },
  { id: "de-haceme-una-app", index: "12", title: "De “haceme una app” a trabajar juntos" },
];

function Chapter({
  index,
  id,
  title,
  children,
}: {
  index: string;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-16 scroll-mt-24 sm:mt-20">
      <Reveal>
        <p className="font-mono text-xs tracking-[0.18em] text-signal tnum">
          {index} / 12
        </p>
        <h2
          id={id}
          className="mt-2 scroll-mt-24 text-balance text-2xl font-bold tracking-tight text-paper sm:text-[28px] sm:leading-[1.25]"
        >
          {title}
        </h2>
      </Reveal>
      <div className="[&>p]:mt-5 [&>p]:text-pretty [&>p]:text-[17px] [&>p]:leading-[1.85] [&>p]:text-paper/90">
        {children}
      </div>
    </section>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-8 border-l border-line pl-5 text-[19px] font-medium leading-[1.7] text-paper sm:text-[20px]">
      {children}
    </blockquote>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-5 list-disc space-y-2.5 pl-6 text-[17px] leading-[1.75] text-paper/90 marker:text-signal">
      {children}
    </ul>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-paper">
      {children}
    </code>
  );
}

export default function ArticlePage() {
  return (
    <div className="relative">
      <ReadingProgress />

      {/* Hero */}
      <header className="relative overflow-hidden rounded-xl border border-line-soft bg-panel px-6 py-10 sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #262d38 1px, transparent 0)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(ellipse 90% 100% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 100% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[68ch]">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.18em] text-dim">
            <Link href="/blog" className="text-fog hover:text-paper">
              BLOG
            </Link>
            <span aria-hidden className="text-line">
              /
            </span>
            <span>APRENDIZAJES</span>
          </p>
          <h1 className="mt-4 text-balance text-3xl font-bold leading-[1.15] tracking-tight text-paper sm:text-[44px]">
            Cuando la IA se convirtió en mi compañero de ingeniería
          </h1>
          <p className="mt-4 font-mono text-xs tracking-[0.14em] text-fog">
            HISTORIA PERSONAL · NEX MISSION CONTROL · ±10 MIN DE LECTURA
          </p>
          <p className="mt-2 text-[15px] text-fog">
            Por Salvador Juarez · 2026
          </p>
        </div>
      </header>

      <div className="mt-8 gap-10 lg:grid lg:grid-cols-[220px_minmax(0,68ch)] lg:justify-center">
        {/* Índice / recorrido */}
        <aside className="lg:pt-2">
          <div className="lg:sticky lg:top-6">
            <TableOfContents items={SECTIONS} />
          </div>
        </aside>

        {/* Artículo */}
        <article className="mt-10 min-w-0 lg:mt-0">
          <Reveal>
            <p className="text-[17px] leading-[1.85] text-paper/90">
              Durante mucho tiempo usé la inteligencia artificial de una manera
              bastante simple.
            </p>
            <p className="mt-5 text-[17px] leading-[1.85] text-paper/90">
              Le decía:
            </p>
            <Quote>{"“Construime una app.”"}</Quote>
            <p className="mt-5 text-[17px] leading-[1.85] text-paper/90">
              Y esperaba que hiciera lo que yo tenía en la cabeza.
            </p>
            <p className="mt-5 text-[17px] leading-[1.85] text-paper/90">
              El problema era que muchas veces no lo hacía.
            </p>
            <p className="mt-5 text-[17px] leading-[1.85] text-paper/90">
              Al principio pensaba que simplemente tenía que aprender a escribir
              mejores prompts. Entonces empecé a investigar cómo explicarle
              mejor las cosas.
            </p>
            <p className="mt-5 text-[17px] leading-[1.85] text-paper/90">
              Y ahí empezó a cambiar todo.
            </p>
          </Reveal>

          <Chapter index="01" id="el-problema-no-era-la-ia" title="El problema no era la IA">
            <Reveal>
              <p>Creo que todos empezamos más o menos igual.</p>
              <p>Tenés una idea en la cabeza y pensás:</p>
              <Quote>{"“Quiero esto.”"}</Quote>
              <p>
                Pero cuando llega el momento de explicárselo a una IA, no sabés
                exactamente cómo decirlo.
              </p>
              <p>
                Entonces le das una instrucción bastante general y la IA empieza
                a construir.
              </p>
              <p>Y muchas veces termina haciendo cualquier cosa.</p>
              <p>
                Pero con el tiempo entendí algo importante: muchas veces{" "}
                <strong className="text-paper">no era culpa de la IA</strong>.
              </p>
              <p>
                Yo tenía una idea muy clara en mi cabeza, pero no sabía
                transmitirla.
              </p>
              <p>
                Era como intentar explicarle a otro desarrollador qué quería
                construir diciéndole solamente:
              </p>
              <Quote>{"“Hacelo como vos puedas.”"}</Quote>
              <p>Obviamente necesitaba más información.</p>
            </Reveal>
          </Chapter>

          <Chapter
            index="02"
            id="de-prompts-al-contexto"
            title="De los prompts al contexto"
          >
            <Reveal>
              <p>Empecé mirando cómo mejorar mis prompts.</p>
              <p>
                Por ejemplo, con herramientas como Suno, antes podía decir algo
                como:
              </p>
              <Quote>
                {"“Quiero música electrónica que suene como Avicii.”"}
              </Quote>
              <p>
                Después empecé a entender que podía especificar mucho más:
                género, BPM, características del bajo, estructura, energía, etc.
              </p>
              <p>Y los resultados cambiaban.</p>
              <p>
                Ahí pensé que simplemente necesitaba darle mucha más información
                a la IA.
              </p>
              <p>Y funcionaba.</p>
              <p>Pero después apareció otro problema.</p>
              <p>
                En proyectos grandes como NEX OS, también podés darle{" "}
                <strong className="text-paper">demasiada información</strong>.
              </p>
              <p>
                Cuando estás trabajando en algo enorme, no todo el contexto es
                relevante para el problema que estás intentando resolver en ese
                momento.
              </p>
              <p>
                Entonces entendí que no se trata de darle más información porque
                sí.
              </p>
              <p>
                Se trata de darle{" "}
                <strong className="text-paper">la información correcta</strong>.
              </p>
              <p>Eso cambió bastante mi forma de pensar.</p>
              <p>Yo sentía que necesitaba mejores planes.</p>
              <p>
                Pero después entendí que un plan gigante y lleno de información
                tampoco necesariamente ayuda.
              </p>
              <p>
                Necesitaba aprender a construir el contexto correcto para cada
                problema.
              </p>
            </Reveal>
          </Chapter>

          <Chapter
            index="03"
            id="cuando-descubri-los-skills"
            title="Cuando descubrí los Skills"
          >
            <Reveal>
              <p>
                En ese proceso empecé a trabajar con los Skills de Matt Pocock /
                AI Hero.
              </p>
              <p>Y mi reacción inicial fue bastante simple:</p>
              <p>
                <strong className="text-paper">WTF.</strong>
              </p>
              <p>
                Había herramientas para trabajar con la IA de una manera mucho
                más estructurada.
              </p>
              <p>Empecé a probar cosas como:</p>
              <List>
                <li>
                  <InlineCode>/domain-modeling</InlineCode>
                </li>
                <li>
                  <InlineCode>/to-spec</InlineCode>
                </li>
                <li>
                  <InlineCode>/to-tickets</InlineCode>
                </li>
                <li>
                  <InlineCode>/implement</InlineCode>
                </li>
                <li>
                  <InlineCode>/tdd</InlineCode>
                </li>
                <li>
                  <InlineCode>/code-review</InlineCode>
                </li>
                <li>
                  <InlineCode>/ask-matt</InlineCode>
                </li>
                <li>
                  <InlineCode>/grill-with-docs</InlineCode>
                </li>
              </List>
              <p>Y ahí pasó algo que no esperaba.</p>
              <p>
                La IA dejó de sentirse solamente como algo al que le pedía
                código.
              </p>
              <p>Empezó a formar parte de un proceso de ingeniería.</p>
            </Reveal>
          </Chapter>

          <Chapter index="04" id="domain-modeling" title="Domain Modeling">
            <Reveal>
              <p>
                Probablemente una de las cosas que más me llamó la atención fue{" "}
                <InlineCode>/domain-modeling</InlineCode>.
              </p>
              <p>Mi reacción fue:</p>
              <Quote>
                {
                  "“Esto también era lo que necesitaba. ¿Por qué no aprendí esto antes?”"
                }
              </Quote>
              <p>
                Antes de implementar Mission Control tuve que pensar realmente
                qué significaba cada cosa.
              </p>
              <p>¿Qué es un Project?</p>
              <p>¿Qué es una Task?</p>
              <p>¿Qué es una Technical Decision?</p>
              <p>¿Qué relación tienen?</p>
              <p>¿Qué debería estar permitido?</p>
              <p>¿Qué no debería estar permitido?</p>
              <p>
                Y cuando empezás a hacer esas preguntas, aparecen problemas que
                antes ni siquiera existían.
              </p>
              <p>Eso me pareció increíble.</p>
              <p>
                Porque cuando una idea está solamente en tu cabeza, todo parece
                sencillo.
              </p>
              <p>
                Después intentás convertirla en software y aparecen los límites.
              </p>
              <p>
                Construir un sistema operativo, por ejemplo, suena increíble.
              </p>
              <p>Pero después tenés que pensar:</p>
              <Quote>
                {
                  "“¿Cómo hago algo suficientemente poderoso sin terminar destruyendo la computadora del usuario?”"
                }
              </Quote>
              <p>Ahí aparecen problemas que antes no estabas pensando.</p>
              <p>Y eso es bueno.</p>
              <p>
                Porque estás encontrando problemas antes de que se conviertan en
                problemas reales.
              </p>
            </Reveal>
          </Chapter>

          <Chapter
            index="05"
            id="idea-grande-dividirse"
            title="Una idea grande empieza a dividirse"
          >
            <Reveal>
              <p>
                Otra cosa que aprendí fue a dejar de mirar un proyecto enorme
                como una sola cosa.
              </p>
              <p>Mission Control podía parecer una idea gigante.</p>
              <p>Pero con el proceso correcto podés empezar a dividirla.</p>
              <p>Primero el dominio.</p>
              <p>Después la especificación.</p>
              <p>Después los tickets.</p>
              <p>Después la implementación.</p>
              <p>Después los tests.</p>
              <p>Después la revisión.</p>
              <p>
                Y así una idea que parece enorme empieza a convertirse en
                problemas mucho más manejables.
              </p>
              <p>No significa que el proyecto sea fácil.</p>
              <p>
                Significa que ahora sé{" "}
                <strong className="text-paper">por dónde empezar</strong>.
              </p>
            </Reveal>
          </Chapter>

          <Chapter
            index="06"
            id="cuando-la-ia-te-contradice"
            title="Cuando la IA te contradice"
          >
            <Reveal>
              <p>También aprendí algo que antes no aprovechaba tanto.</p>
              <p>La IA puede decirte:</p>
              <Quote>
                {
                  "“Che, esto que estás planteando quizás no sea la mejor solución.”"
                }
              </Quote>
              <p>Y eso no necesariamente es algo malo.</p>
              <p>De hecho, muchas veces es exactamente lo que necesitás.</p>
              <p>
                En Mission Control hubo momentos en los que una propuesta podía
                hacer que el producto terminara pareciéndose demasiado a un Task
                Manager.
              </p>
              <p>Yo podía decir:</p>
              <Quote>
                {
                  "“Me gusta lo que proponés, pero podemos ver de implementar ambas soluciones quizás producimos algo mejor.”"
                }
              </Quote>
              <p>Y ahí aparece algo interesante.</p>
              <p>No tenés que aceptar todo lo que dice la IA.</p>
              <p>Pero tampoco tenés que rechazarlo automáticamente.</p>
              <p>Podés discutir.</p>
              <p>Podés preguntarle.</p>
              <p>Podés buscar otra alternativa.</p>
              <p>
                Podés incluso darte cuenta de que estaba viendo algo que vos no
                habías visto.
              </p>
              <p>
                Y eso me hizo pensar en algo que también considero importante
                como desarrollador:
              </p>
              <p>
                <strong className="text-paper">
                  no mirar un problema desde un solo lado.
                </strong>
              </p>
              <p>Podés pensar en funcionalidad.</p>
              <p>Pero también en seguridad.</p>
              <p>En performance.</p>
              <p>En escalabilidad.</p>
              <p>En casos extremos.</p>
              <p>En qué pasa mañana si el sistema crece.</p>
            </Reveal>
          </Chapter>

          <Chapter
            index="07"
            id="y-si-manana-explota"
            title="“¿Y si mañana explota esto?”"
          >
            <Reveal>
              <p>En la universidad muchas veces te plantean algo como:</p>
              <Quote>{"“Creá un sistema para diez personas.”"}</Quote>
              <p>
                Pero cuando empezás a trabajar como desarrollador cambia la
                pregunta.
              </p>
              <p>Ya no pensás solamente en esas diez personas.</p>
              <p>Pensás:</p>
              <Quote>{"“¿Qué pasa si mañana explota esto?”"}</Quote>
              <p>¿Qué pasa si empiezan a llegar muchísimas requests?</p>
              <p>¿Qué pasa si una API recibe demasiadas peticiones?</p>
              <p>¿Qué pasa si una parte del sistema se satura?</p>
              <p>Esas preocupaciones ya eran mías.</p>
              <p>La IA no inventó esos problemas por mí.</p>
              <p>
                Lo que hizo fue ayudarme a explorar diferentes soluciones,
                riesgos y formas de comprobar si el sistema podía soportarlos.
              </p>
              <p>
                Incluso terminé implementando monitoreo para poder observar lo
                que estaba pasando.
              </p>
              <p>
                Ahí entendí que la IA no tiene que decidir qué problema me
                importa.
              </p>
              <p>
                Puede ayudarme a pensar mucho más profundamente sobre el problema
                que <strong className="text-paper">yo</strong> decidí resolver.
              </p>
            </Reveal>
          </Chapter>

          <Chapter
            index="08"
            id="companero-de-ingenieria"
            title="La IA como compañero de ingeniería"
          >
            <Reveal>
              <p>
                Después de todo esto, para mí hay una diferencia enorme entre
                decir que la IA es un “asistente de programación” y decir que es
                un <strong className="text-paper">compañero de ingeniería</strong>
                .
              </p>
              <p>Porque ya no solamente escribe código.</p>
              <p>Puede ayudarte a pensar.</p>
              <p>Puede cuestionar una decisión.</p>
              <p>Puede encontrar un caso que no habías contemplado.</p>
              <p>Puede ayudarte a dividir una idea enorme.</p>
              <p>Puede ayudarte a investigar.</p>
              <p>Puede revisar lo que hiciste.</p>
              <p>Y también puede equivocarse.</p>
              <p>Eso último es importante.</p>
              <p>La IA no se convirtió mágicamente en un ingeniero perfecto.</p>
              <p>Lo que cambió fue la forma en la que yo trabajaba con ella.</p>
              <p>Yo seguía teniendo que decidir qué quería construir.</p>
              <p>Seguía teniendo que decidir qué propuesta tenía sentido.</p>
              <p>Seguía teniendo que revisar.</p>
              <p>
                Pero ahora tenía otra perspectiva disponible mientras
                desarrollaba.
              </p>
              <p>Y muchas veces esa perspectiva me hacía decir:</p>
              <Quote>{"“Ah, para esto no pensé.”"}</Quote>
              <p>Y para mí eso es algo bueno.</p>
            </Reveal>
          </Chapter>

          <Chapter index="09" id="tambien-aprendi-yo" title="También aprendí yo">
            <Reveal>
              <p>Quizás esta sea una de las partes que menos esperaba.</p>
              <p>Pensé que iba a aprender a utilizar mejor la IA.</p>
              <p>Y terminé aprendiendo mejor algunas cosas de ingeniería.</p>
              <p>El proceso me llevó a pensar de forma más estructurada.</p>
              <p>A definir mejor los problemas.</p>
              <p>A entender mejor los dominios.</p>
              <p>A dividir proyectos.</p>
              <p>A pensar en límites.</p>
              <p>A considerar casos que antes quizás no tenía presentes.</p>
              <p>Entonces no fue solamente:</p>
              <Quote>
                {"“Aprendí a darle mejores instrucciones a la IA.”"}
              </Quote>
              <p>
                También aprendí a pensar mejor sobre lo que estaba intentando
                construir.
              </p>
            </Reveal>
          </Chapter>

          <Chapter
            index="10"
            id="dominar-la-ia"
            title="Entonces, ¿qué significa dominar la IA?"
          >
            <Reveal>
              <p>Creo que “dominar la IA” no es lo que uno se imaginaría.</p>
              <p>No es como aprender React.</p>
              <p>
                Y, siendo sincero, tampoco creo que lleguemos a dominar
                completamente las tecnologías que usamos.
              </p>
              <p>Lo que hacemos es empezar a entender cómo trabajar con ellas.</p>
              <p>Con la IA me pasó algo parecido.</p>
              <p>Empecé entendiendo cómo podía comunicarme mejor.</p>
              <p>Después entendí cómo darle contexto.</p>
              <p>Después cómo estructurar un proceso.</p>
              <p>Y finalmente cómo aprovechar todo eso para construir.</p>
              <p>
                Para mí, dominar la IA significa empezar a entender{" "}
                <strong className="text-paper">
                  cómo hacer para que deje de ser tu enemigo y se convierta en
                  tu aliado
                </strong>
                .
              </p>
            </Reveal>
          </Chapter>

          <Chapter
            index="11"
            id="recien-empieza"
            title="Lo que le diría a alguien que recién empieza"
          >
            <Reveal>
              <p>Creo que todos nos frustramos al principio.</p>
              <p>Todos empezamos diciéndole:</p>
              <Quote>{"“Haceme una app.”"}</Quote>
              <p>
                Y después nos preguntamos por qué no hizo exactamente lo que
                imaginábamos.
              </p>
              <p>Pero es normal.</p>
              <p>Yo también empecé ahí.</p>
              <p>
                Con el tiempo entendés que la IA puede darte resultados mucho
                mejores cuando aprendés a explicarle lo que querés lograr.
              </p>
              <p>
                Y para mí la mejor forma de pensarlo es como si estuvieras
                hablando con otro desarrollador.
              </p>
              <p>No le dirías simplemente:</p>
              <Quote>{"“Construí esto.”"}</Quote>
              <p>Le explicarías qué querés lograr.</p>
              <p>Por qué lo querés.</p>
              <p>Qué tecnologías estás usando.</p>
              <p>Qué restricciones existen.</p>
              <p>Qué esperás.</p>
              <p>Qué problemas querés resolver.</p>
              <p>Y cuanto mejor entendés eso, mejor podés trabajar con la IA.</p>
            </Reveal>
          </Chapter>

          <Chapter
            index="12"
            id="de-haceme-una-app"
            title="De “haceme una app” a trabajar juntos"
          >
            <Reveal>
              <p>Si miro hacia atrás, creo que mi evolución fue bastante simple.</p>
              <p>Primero quería que la IA hiciera cosas por mí.</p>
              <p>Después quería aprender a decirle mejor qué hacer.</p>
              <p>Después entendí la importancia del contexto.</p>
              <p>
                Después descubrí que no necesitaba simplemente más contexto, sino
                el contexto correcto.
              </p>
              <p>Después empecé a estructurar el trabajo.</p>
              <p>
                Y finalmente entendí que la IA podía ser mucho más que una
                herramienta para generar código.
              </p>
              <p>Podía ser parte de mi proceso de ingeniería.</p>
              <p>No porque yo le haya dicho:</p>
              <Quote>{"“Sos un desarrollador.”"}</Quote>
              <p>
                Sino porque aprendí a trabajar con ella de una manera que hacía
                que pudiera participar mucho mejor en el proceso.
              </p>
              <p>
                Y creo que ese fue uno de los aprendizajes más grandes que me
                llevo.
              </p>
              <p>
                <strong className="text-paper">
                  No se trata solamente de hacer que la IA haga más cosas.
                </strong>
              </p>
              <p>Se trata de aprender cómo trabajar con ella.</p>
              <p>
                Porque cuando aprendés eso, una idea que antes parecía demasiado
                grande puede empezar a convertirse en algo real.
              </p>
            </Reveal>
          </Chapter>

          {/* Cierre */}
          <Reveal className="mt-16 border-t border-line-soft pt-8 sm:mt-20">
            <p className="font-mono text-[11px] tracking-[0.18em] text-dim">
              FIN · 12 / 12
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-fog">
              Texto publicado desde{" "}
              <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-paper">
                docs/blog/aprendizajes-ia-companero-ingenieria.md
              </code>
              , conservando el contenido y la voz originales.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-raised"
              >
                ← Blog
              </Link>
              <Link
                href="/"
                className="rounded-md bg-signal px-4 py-2.5 text-sm font-bold text-void transition-colors hover:bg-paper"
              >
                Ver proyectos →
              </Link>
            </div>
          </Reveal>
        </article>
      </div>
    </div>
  );
}
