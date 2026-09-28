# CLAUDE.md — Bootcamp Notes

TIENES PROHIBIDO PONERTE COMO COAUTOR

## Qué es este proyecto

Web personal (Astro) donde centralizo los apuntes de todos los bootcamps que hago.
Yo pego los apuntes originales (normalmente en inglés) y Claude los **traduce, resume y
representa** como un apunte en Markdown con una card en el bootcamp correspondiente.

Fase actual: **1 — construir la web.**
Fase siguiente: **2 — comando/skill para generar apuntes** (ver sección al final).

## Idioma y tono

- Todo el contenido, la UI, los comentarios de código y los mensajes de commit van en **español de España**.
- Los términos técnicos se mantienen en inglés cuando es lo habitual en el sector
  (Merkle tree, trie, gas, nonce, state root…). La primera vez que aparecen en un apunte
  se acompañan de una explicación breve en español.
- No inventes contenido que no esté en los apuntes originales. Si añades contexto propio
  para aclarar algo, márcalo como nota (`> **Nota:** …`).

## Stack

- **Astro** (última versión estable), sitio 100 % estático.
- **Content Collections** con esquema validado con Zod (`src/content.config.ts`).
- Apuntes en **Markdown (`.md`)**. Nada de MDX mientras no haga falta.
- **Tailwind CSS v4** para estilos. Modo claro/oscuro con `prefers-color-scheme`.
- **Mermaid** renderizado en cliente para los bloques ```` ```mermaid ````.
- Sin frameworks de UI (React, Vue…) salvo que se justifique y se pregunte antes.
- Entorno de desarrollo: Windows 11. Los scripts y comandos deben funcionar en Windows
  (nada de `rm -rf`, `cp`, variables tipo `VAR=x cmd` en los scripts de `package.json`).

## Estructura

```
src/
  content.config.ts          # esquemas de las colecciones
  content/
    bootcamps/               # un .json por bootcamp (metadatos)
      alchemy-ethereum.json
    apuntes/                 # apuntes generados
      <bootcamp-slug>/
        <tema-slug>/
          <nn>-<titulo-slug>.md
  components/                # Card, TopicList, Badge, Mermaid...
  layouts/
  pages/
    index.astro              # listado de bootcamps
    [bootcamp]/index.astro   # temas y cards del bootcamp
    [bootcamp]/[...slug].astro  # apunte individual
originales/                  # apuntes originales tal cual los pego (ver Git)
```

Los slugs van en minúsculas, sin tildes ni eñes, separados por guiones.
`<nn>` es el orden dentro del tema con dos dígitos (`01`, `02`…).

## Esquemas

### Bootcamp (`src/content/bootcamps/*.json`)

```ts
{
  nombre: string,          // "Ethereum Bootcamp"
  plataforma: string,      // "Alchemy University"
  url?: string,
  estado: "en-curso" | "terminado" | "pausado",
  color: string,           // color de acento en hex para sus cards
  inicio?: date,
}
```

### Apunte (`src/content/apuntes/**/*.md`)

```ts
{
  titulo: string,          // lo que yo diga en el prompt
  bootcamp: reference("bootcamps"),
  tema: string,            // lo que yo diga en el prompt
  orden: number,
  fecha: date,             // fecha en que se genera el apunte
  resumen: string,         // 1-2 frases, se muestra en la card
  conceptos: string[],     // 3-8 conceptos clave, se muestran como chips
  idiomaOriginal: string,  // "en", "es"...
  original?: string,       // ruta al archivo en /originales
}
```

Si el frontmatter no cumple el esquema, el build falla: es intencionado.
**No relajes el esquema para que pase un apunte; corrige el apunte.**

## Formato del cuerpo de cada apunte

Siempre con esta estructura y en este orden (las secciones vacías se omiten):

1. `## TL;DR` — 3-5 viñetas con lo esencial.
2. `## Conceptos clave` — cada concepto en negrita con su explicación corta.
3. `## Explicación` — el contenido traducido y condensado, con subtítulos propios.
   No es una traducción literal: se reorganiza y se elimina la paja
   ("¡lo estás haciendo genial!", repeticiones, relleno motivacional).
4. `## Esquema` — al menos un diagrama Mermaid o una tabla comparativa cuando
   el tema lo permita.
5. `## Glosario` — términos técnicos nuevos (inglés → explicación en español).
6. `## Preguntas de repaso` — 3-5 preguntas; respuestas en `<details>`.

Las imágenes del original que no tengo (aparecen solo como nombre, p. ej. `eth-block`)
se sustituyen por un diagrama Mermaid equivalente o se omiten; nunca se dejan
referencias rotas.

## Diseño

- Estética limpia y técnica: tipografía legible, buen contraste, cards con el color
  de acento del bootcamp, chips para los conceptos.
- Responsive desde móvil (sin scroll horizontal).
- Accesible: HTML semántico, `alt` en imágenes, foco visible, contraste AA.
- Nada de animaciones pesadas. Transiciones sutiles como mucho.

## Normas de trabajo

- Antes de cambios grandes (nueva dependencia, cambio de estructura o de esquema),
  explica el plan y espera confirmación.
- No instales dependencias sin preguntar.
- Cambios pequeños y enfocados; no refactorices lo que no se ha pedido.
- Antes de dar algo por terminado: `npm run build` sin errores ni warnings nuevos.
- Si algo no está claro, pregunta en vez de suponer.
- Sé crítico: si una petición mía es mala idea o tiene una opción mejor, dilo.

## Git

- **Nunca** añadas `Co-Authored-By` ni menciones a Claude/Claude Code en los commits,
  ni "Generated with Claude Code" en commits o PRs. El autor soy yo.
- Commits en español con Conventional Commits:
  `feat: …`, `fix: …`, `style: …`, `refactor: …`, `docs: …`, `chore: …`,
  `content: …` (para apuntes nuevos o editados).
  Ejemplo: `content(alchemy-ethereum): añade apunte de Patricia Merkle Tries`
- Un commit por unidad lógica de cambio. No hagas commit ni push sin que lo pida.
- Nunca uses `--force`, `reset --hard` ni reescribas historial sin permiso explícito.
- `/originales` está en `.gitignore` si el repo es público (el material de los
  cursos tiene derechos de autor; lo que se publica son mis apuntes, no el original).

## Fase 2 — Generador de apuntes (pendiente)

Se implementará como comando/skill de Claude Code (`/apunte`) que reciba:
`bootcamp`, `tema`, `titulo` y el texto original, y que:

1. Guarde el original en `originales/<bootcamp>/<tema>/<nn>-<titulo>.md`.
2. Calcule el siguiente `orden` dentro del tema.
3. Genere el apunte siguiendo **exactamente** el formato de este archivo.
4. Si el bootcamp no existe, pregunte sus datos y cree su `.json`.
5. Ejecute `npm run build` para validar el esquema.
6. Proponga el mensaje de commit, sin hacerlo.

No empezar esta fase hasta que la web esté terminada.
