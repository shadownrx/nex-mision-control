# Aprendizajes — Trabajar con IA como compañero de ingeniería

## 1. El problema inicial

Todo comenzó con una pregunta bastante simple:

> **¿Cómo le digo a la IA que haga mejores cosas?**

Al principio, mi forma de trabajar con IA era principalmente pedirle resultados.

Por ejemplo:

> “Construime una app.”

La IA podía producir código, componentes, endpoints y pantallas. Pero había una diferencia importante entre **generar código** y **entender qué debía construirse**.

El problema no era solamente la capacidad de la IA.

El problema era el contexto que yo le estaba dando.

---

## 2. El cambio: dejar de pedir solamente código

Con el tiempo empecé a darle más información antes de pedir una implementación:

* qué problema quería resolver;
* qué quería conseguir;
* qué decisiones ya había tomado;
* qué cosas estaban fuera de alcance;
* qué restricciones tenía;
* qué significaba que algo estuviera correctamente implementado;
* cómo debía verificarse el resultado.

Sin darme cuenta, empecé a cambiar la relación con la IA.

Ya no era:

```text
Yo → pedido → IA → código
```

Sino algo más parecido a:

```text
Problema
   ↓
Contexto
   ↓
Decisiones
   ↓
Especificación
   ↓
Implementación
   ↓
Tests
   ↓
Revisión
   ↓
Verificación
```

Y ahí apareció uno de los aprendizajes más importantes del proyecto:

> **No necesitaba decirle a la IA “sos un desarrollador”. Necesitaba darle un proceso de ingeniería dentro del cual pudiera trabajar.**

---

## 3. Lo que pasó con Muse

NEX Mission Control fue el proyecto donde puse esta idea a prueba.

No le dije a Muse:

> “Comportate como un Senior Software Engineer.”

En cambio, le fui dando contexto, restricciones, documentos, especificaciones, tickets y criterios de verificación.

El comportamiento resultante empezó a parecerse cada vez más al de un compañero de ingeniería.

Muse podía:

* cuestionar una definición del producto;
* detectar scope creep;
* proponer límites de dominio;
* convertir una idea en una especificación;
* dividir trabajo en tickets;
* implementar siguiendo esos límites;
* escribir y ejecutar tests;
* detectar defectos;
* revisar invariantes;
* verificar que no se hubieran agregado funcionalidades fuera de alcance.

La diferencia es importante.

No estaba intentando darle una personalidad.

Estaba construyendo un **sistema de trabajo**.

---

## 4. El grilling cambió el proyecto

Una de las partes más importantes fue descubrir que la primera definición de Mission Control no era todavía el producto que quería construir.

La primera idea podía resumirse como:

> Notion + GitHub Projects + decisiones técnicas + documentación + actividad.

Pero al analizarla, apareció un problema:

> **Eso podía terminar siendo simplemente un Task Manager con varias entidades adicionales.**

El grilling obligó a preguntar:

* ¿Qué problema específico resuelve?
* ¿Qué información necesita existir?
* ¿Qué debería derivarse automáticamente?
* ¿Qué no debería existir?
* ¿Qué decisiones son realmente parte del dominio?
* ¿Qué significa “actividad”?
* ¿Qué información debería desaparecer cuando un registro se elimina?

Eso llevó a una definición mucho más precisa:

> **NEX Mission Control no rastrea solamente qué hay que hacer. Muestra cómo evoluciona cada proyecto: qué se decidió y por qué, qué cambió y qué sigue abierto.**

Ese cambio fue más importante que cualquier componente de UI que se haya escrito después.

---

## 5. Domain modeling antes de programar

Otro aprendizaje fue que muchas discusiones que parecen técnicas en realidad son decisiones de dominio.

Por ejemplo:

### Activity

Podíamos haber creado una tabla `activity`.

Pero al analizar el problema, no era necesario.

La actividad podía derivarse de los cambios que ya conocíamos.

Por eso:

```text
Activity = derived view
```

y no:

```text
Activity = persisted entity
```

Eso evitó convertir el sistema en un audit log que nadie había pedido.

### Project status

También apareció la posibilidad de tener algo como:

```text
active
stalled
done
```

Pero esos estados introducían una semántica que el dominio todavía no justificaba.

En lugar de inventar un estado de proyecto, se utilizaron señales observables:

```text
openTasks
closedTasks
activeDecisions
supersededDecisions
documents
lastActivity
```

La aplicación muestra información.

No inventa significado.

---

## 6. La especificación redujo ambigüedad

`/to-spec` fue importante porque convirtió decisiones dispersas en comportamiento verificable.

Por ejemplo, en Stage 2 se definió exactamente:

* cómo calcular `lastActivity`;
* qué decisiones aparecen en `direction`;
* cómo se ordenan;
* cuál es el límite;
* cómo se agrupan los episodios;
* cómo funciona la supersession;
* qué ocurre cuando no hay actividad;
* qué ocurre cuando se eliminan todos los registros.

Esto cambió la naturaleza del trabajo.

La IA ya no tenía que interpretar libremente:

> “Hacé un overview del proyecto.”

Tenía reglas concretas contra las cuales implementar y probar.

---

## 7. Los tickets funcionaron como límites

`/to-tickets` convirtió la especificación en unidades verticales de trabajo.

Esto permitió que cada implementación tuviera:

* objetivo;
* alcance;
* dependencias;
* invariantes;
* criterios de aceptación;
* cosas explícitamente prohibidas.

Esto fue particularmente importante para evitar que la IA agregara funcionalidades simplemente porque parecían útiles.

Un ticket podía decir:

> No agregar nuevos endpoints.

> No agregar persistencia.

> No modificar el dominio.

> No agregar Project Status.

Y esas restricciones formaban parte de la ingeniería, no eran una sugerencia.

---

## 8. La IA también puede equivocarse de una forma interesante

Un aprendizaje importante fue que el problema no desaparece porque la IA sea capaz.

Por ejemplo, durante el desarrollo apareció el problema de Vitest ejecutando workers en paralelo sobre la misma base de datos.

El resultado era una interacción entre tests que no tenía que ver con la lógica del producto.

La solución fue:

```text
fileParallelism: false
```

No se cambió el comportamiento de la aplicación.

Se corrigió el entorno de ejecución de los tests.

Esto mostró otra cosa:

> **Cuando algo falla, primero hay que entender qué capa está fallando antes de pedirle a la IA que “lo arregle”.**

---

## 9. Los edge cases también enseñan sobre el dominio

En S2-05 apareció un caso interesante:

Una cadena completamente superseded no podía producirse normalmente mediante la API porque la invariante del repositorio garantiza que el head permanece activo.

Eso significaba que el test no representaba un flujo normal de usuario.

Pero seguía siendo útil para comprobar que la función de derivación podía manejar inputs parciales o legacy sin romperse.

La lección fue:

> **Un test no siempre describe algo que el usuario puede hacer. También puede proteger una propiedad del sistema frente a estados inesperados.**

---

## 10. El momento más interesante: no cambiar nada

S2-06 fue una de las partes más reveladoras.

La instrucción era verificar Stage 2 completo.

La IA ejecutó:

* tests;
* typecheck;
* build;
* `db:push`;
* inspecciones de persistencia;
* revisión de anchors;
* revisión de copy;
* búsqueda de scope creep;
* comprobación de invariantes.

Resultado:

```text
22 archivos de tests
115 tests
0 fallos
0 defectos
0 archivos modificados
```

La implementación correcta de una tarea de ingeniería fue:

> **No tocar el código.**

Eso es importante porque demuestra que el objetivo de una IA de desarrollo no debería ser producir cambios.

El objetivo debería ser producir **el cambio correcto, o ninguno cuando no hace falta cambiar nada**.

---

## 11. Qué cambió en mi forma de usar IA

Antes pensaba principalmente en:

> “¿Qué prompt tengo que escribir para conseguir un mejor resultado?”

Ahora pienso más en:

> “¿Qué contexto necesita la IA para tomar una buena decisión?”

La diferencia parece pequeña, pero cambia completamente el enfoque.

Ahora pienso en:

```text
Contexto
+ restricciones
+ dominio
+ especificación
+ herramientas
+ tests
+ feedback
+ verificación
```

como parte de la interfaz con la IA.

El prompt es solamente una parte.

---

## 12. Prompt engineering vs. AI engineering

Una de las conclusiones que me llevo de este proyecto es que existe una diferencia entre optimizar una instrucción y diseñar un sistema de trabajo.

### Prompt engineering

Busca principalmente:

> “¿Cómo tengo que pedírselo?”

### AI-assisted engineering

Empieza a preguntar:

> “¿Qué contexto, herramientas, restricciones, feedback y mecanismos de verificación necesita la IA para trabajar de forma confiable?”

En NEX Mission Control, la segunda aproximación fue mucho más importante que encontrar una frase mágica.

---

## 13. La IA no reemplazó el criterio

Durante todo el proyecto hubo decisiones que no podían delegarse simplemente a:

> “Elegí lo que consideres mejor.”

Por ejemplo:

* qué problema resolver;
* qué queda fuera;
* qué significa Activity;
* si una información debe persistirse;
* qué semántica no debe introducirse;
* qué invariantes son importantes;
* qué comportamiento aceptar;
* cuándo una feature constituye scope creep.

La IA puede ayudar a explorar esas decisiones.

Pero alguien tiene que decidir qué problema vale la pena resolver y qué sistema se quiere construir.

Ese fue mi papel durante el proyecto.

---

## 14. El verdadero aprendizaje

El aprendizaje más importante no fue aprender a hacer mejores prompts.

Fue entender que **la calidad de la IA depende enormemente del sistema en el que la colocás**.

Una IA puede recibir:

```text
“Construime una app.”
```

y producir algo.

Pero puede recibir:

```text
Contexto
+
Problema
+
Dominio
+
Restricciones
+
Especificación
+
Tickets
+
Tests
+
Feedback
+
Verificación
```

y trabajar dentro de un proceso mucho más parecido a ingeniería real.

Por eso, mirando hacia atrás, siento que no aprendí simplemente a “usar mejor la IA”.

Aprendí a **dirigirla**.

Y quizás la mejor forma de resumir todo el proyecto sea esta:

> **No le enseñé a la IA a ser un desarrollador. Aprendí a construir el contexto en el que podía trabajar como uno.**
