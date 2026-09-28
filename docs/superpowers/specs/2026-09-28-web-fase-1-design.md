# Web de la Bitácora (Fase 1): diseño

Fecha: 2026-09-28
Estado: aprobado por delegación (el autor pidió que se tomaran las decisiones sin preguntar;
este documento las recoge para revisarlas a posteriori).

## Objetivo

Web estática en Astro que liste bootcamps, sus apuntes agrupados por tema y cada apunte con
una lectura cómoda. Al terminar, añadir un apunte debe consistir solo en crear un `.md` en
`src/content/apuntes/<bootcamp>/<tema>/<nn>-<titulo>.md` (Fase 2).

Criterios de éxito:

- `npm run build` sin errores ni warnings nuevos.
- Tres tipos de página funcionando con un bootcamp y un apunte de prueba.
- Mermaid renderizado en cliente, respetando el tema claro/oscuro del sistema.
- Responsive desde 320 px sin scroll horizontal; foco visible; contraste AA.

## Stack (versiones a 2026-09-28)

- Astro 7.3 (plantilla `minimal`, `tsconfig` estricto).
- Tailwind CSS 4.3 con `@tailwindcss/vite`.
- Mermaid 12, cargado con `import()` dinámico solo en páginas que tienen diagramas.
- Tipografías con la Fonts API de Astro (se descargan en el build y se sirven desde el propio
  sitio; no añade dependencias ni peticiones a terceros en tiempo de ejecución).
- Sin plugin de tipografía de Tailwind: los estilos del cuerpo del apunte (`.prose`) se
  escriben a mano en `src/styles/global.css`.

## Contenido

### Colecciones (`src/content.config.ts`)

- `bootcamps`: loader `glob({ pattern: '*.json', base: './src/content/bootcamps' })`.
  El id es el nombre del fichero (`alchemy-ethereum`).
- `apuntes`: loader `glob({ pattern: '**/*.md', base: './src/content/apuntes' })`.
  El id es la ruta sin extensión (`alchemy-ethereum/<tema>/<nn>-<titulo>`).

Esquemas idénticos a los del CLAUDE.md, con estas precisiones (todas endurecen, ninguna
relaja):

- `color`: hex de 6 dígitos (`/^#[0-9a-fA-F]{6}$/`).
- `inicio` y `fecha`: `z.coerce.date()` (en JSON y YAML llegan como cadena).
- `orden`: entero positivo.
- `conceptos`: entre 3 y 8 elementos.
- `resumen`, `titulo`, `tema`: cadenas no vacías.

### Coherencia ruta ↔ frontmatter

`src/lib/apuntes.ts` comprueba en build y lanza un error claro si:

- el primer segmento de la ruta del apunte no coincide con `bootcamp` del frontmatter;
- dos apuntes del mismo bootcamp y tema comparten `orden`.

### Rutas

- `/` → bootcamps.
- `/<bootcamp>/` → apuntes del bootcamp.
- `/<bootcamp>/<tema-slug>/<nn>-<titulo-slug>/` → apunte. El `slug` es el id sin el prefijo
  del bootcamp.

## Diseño visual

Concepto: la bitácora como cuaderno de ingeniería. Fondo con retícula de papel cuadriculado
muy tenue; cada apunte es una entrada del cuaderno con un lomo del color del bootcamp y su
número de orden (es una secuencia real, por eso se numera).

Tokens (en `:root`, redefinidos con `prefers-color-scheme: dark`):

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--paper` | `#EEF2F6` | `#0F1928` | fondo |
| `--sheet` | `#F8FAFC` | `#16233A` | superficies (cards, índice) |
| `--ink` | `#15233B` | `#DCE4EE` | texto principal |
| `--ink-soft` | `#4A5872` | `#9DAAC0` | texto secundario |
| `--rule` | `#D5DDE8` | `#26364F` | bordes y retícula |
| `--accent` | color del bootcamp | igual | lomos y marcas decorativas |
| `--accent-ink` | `color-mix` del acento con la tinta | con blanco | texto en color de acento |

Tipografía:

- Schibsted Grotesk: interfaz y títulos.
- Newsreader: cuerpo de los apuntes (serif, interlineado 1.7, medida ≤ 70 caracteres).
- JetBrains Mono: solo bloques y fragmentos de código.

Evitar: etiquetas en mayúsculas, metadatos unidos con “·”, flechas decorativas en enlaces,
sombras genéricas en las cards, animaciones de entrada. Única animación: transiciones de
color/borde en hover y foco, desactivadas con `prefers-reduced-motion`.

El color del bootcamp se inyecta como `style="--accent: #…"` en el contenedor de la página
o de la card.

## Páginas

### `/`

Cabecera con “Bitácora” como pieza tipográfica grande y una línea de descripción. Grid de
bootcamps (1 columna en móvil, 2 en ≥ md): nombre, plataforma, estado (texto + marca),
número de apuntes y número de temas. Estado vacío: texto que explica dónde crear el `.json`.

### `/<bootcamp>/`

Migas de pan, cabecera con nombre, plataforma, estado, fecha de inicio y enlace externo.
Un bloque por tema (orden: fecha del primer apunte y luego nombre) con los apuntes ordenados
por `orden`. Card: número de orden grande en color de acento, título, resumen, fecha y chips
de conceptos. Toda la card es un enlace (un único `<a>` con el título; el resto de la card
se hace clicable con un pseudo-elemento para no anidar enlaces).

### `/<bootcamp>/<...slug>/`

- Migas: Bitácora › Bootcamp › Tema.
- Cabecera: tema y número, título, fecha, idioma original, resumen como entradilla y chips.
- Dos columnas en ≥ lg: artículo (máx. ~70ch) + índice lateral fijo (`position: sticky`)
  con los `h2`/`h3`, que resalta la sección visible (IntersectionObserver).
  En móvil el índice va en un `<details>` plegable antes del artículo.
- Navegación anterior/siguiente dentro del mismo tema, al final.
- Bloques `<details>` estilizados para las respuestas de repaso.

## Mermaid

- `markdown.syntaxHighlight.excludeLangs: ['mermaid']` para que Shiki no toque esos bloques.
- `src/components/Mermaid.astro` (script cliente): localiza los bloques, guarda el código
  fuente, importa `mermaid` solo si hay alguno, renderiza con tema `neutral` o `dark` según
  `prefers-color-scheme` y vuelve a renderizar cuando cambia el esquema del sistema.
- Si un diagrama falla, se muestra el código original y un aviso, sin romper la página.

## Resaltado de código

Shiki con temas duales (`github-light` / `github-dark`) cambiando por `prefers-color-scheme`.

## Verificación

No hay framework de tests (no se han autorizado más dependencias). La verificación es:

1. `npm run build` sin errores ni warnings.
2. Inspección del HTML generado en `dist/` (rutas, `id` de los encabezados, bloques mermaid).
3. Capturas con Edge en modo headless (claro y oscuro, móvil y escritorio) para revisar el
   diseño.

## Fuera de alcance

Buscador, etiquetas por concepto, selector manual de tema, RSS, despliegue, Fase 2.
