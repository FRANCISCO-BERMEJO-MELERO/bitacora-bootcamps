---
name: apunte
description: Genera un apunte de la Bitácora a partir de un texto original de un bootcamp (normalmente en inglés) — lo traduce, lo resume y lo guarda con el formato del proyecto, junto con el original. Úsala cuando el usuario ejecute /apunte o pida convertir material de un curso en un apunte.
argument-hint: <bootcamp> | <tema> | <título> [@ruta/al/original] + texto original debajo
---

# /apunte — generador de apuntes

Convierte un texto original de un bootcamp en un apunte de `src/content/apuntes/` que
cumple el esquema y el formato del `CLAUDE.md`. Todo en español de España.

Entrada recibida:

```
$ARGUMENTS
```

Archivos de la skill (rutas relativas a la raíz del repo):

- `.claude/skills/apunte/plantilla.md` — **plantilla obligatoria del apunte**. Léela
  siempre antes de escribir; el formato sale de ella, no de memoria.
- `.claude/skills/apunte/scripts/preparar.mjs` — calcula slugs, `orden`, rutas y duplicados.
- `.claude/skills/apunte/scripts/copiar-original.mjs` — copia un original byte a byte.

Sigue los pasos en orden. Si un paso dice «para», no sigas hasta tener respuesta.

## 1. Validar la entrada

**Formato:** la primera línea es `<bootcamp> | <tema> | <título>`. El original es:

- el texto que va debajo de la primera línea, **o**
- una ruta con `@` al final de la primera línea o en la línea siguiente
  (p. ej. `@originales/pmt.txt`). Si Claude Code ya ha adjuntado el contenido del
  archivo, úsalo para leer, pero la ruta sigue siendo la fuente para copiar el original.

1. Si falta bootcamp, tema, título o texto original (o la ruta no existe), di qué falta
   con el formato esperado y **para**.
2. Ejecuta el script con los tres campos tal cual los escribió el usuario:

   ```
   node .claude/skills/apunte/scripts/preparar.mjs "<bootcamp>" "<tema>" "<título>"
   ```

   Devuelve `bootcamp` y `tema` (slugs de carpeta), `tituloSlug`, `orden`, `rutas`,
   `bootcampExiste`, `temaNombreExistente`, `duplicado` y `fecha`. Usa **estos valores**;
   no calcules slugs ni órdenes a mano.
3. Si `bootcampExiste` es `false`: pregunta al usuario nombre, plataforma, url (opcional),
   estado (`en-curso` | `terminado` | `pausado`), color (hex de 6 dígitos que se lea bien
   en claro y en oscuro; propón uno) y fecha de inicio (opcional). Crea
   `src/content/bootcamps/<bootcamp>.json` con el mismo formato que los existentes y
   **después** sigue. Si el slug se parece a uno de `bootcampsExistentes` (errata
   probable), pregunta antes si se refería a ese.
4. Si `duplicado` no es `null`: avisa de que ya existe `duplicado.archivo` con ese título
   y pregunta si **sobrescribirlo** (se usan `duplicado.rutasSobrescribir` y
   `duplicado.orden`) o **crear uno nuevo** (se usan `rutas` y `orden`). **Para** hasta
   que responda.

## 2. Orden

Usa `orden` del script (máximo existente + 1, o 1 si el tema es nuevo), salvo si se
sobrescribe. El prefijo `<nn>` del archivo ya viene en las rutas.

## 3. Guardar el original sin tocar

- Si viene de un archivo:
  `node .claude/skills/apunte/scripts/copiar-original.mjs "<ruta origen>" "<rutas.original>"`.
  El archivo de origen se deja donde estaba.
- Si viene pegado: escribe en `rutas.original` **exactamente** el texto pegado, sin
  reformatear, sin corregir y sin añadir cabeceras.

`originales/` está en `.gitignore`: el original nunca se sube.

## 4. Generar el apunte

Lee `plantilla.md` y el original completo. Escribe el apunte en `rutas.apunte`.

**Frontmatter** (todos los campos; el build lo valida con Zod):

| Campo | Valor |
| --- | --- |
| `titulo` | El título tal cual lo dio el usuario. |
| `bootcamp` | `bootcamp` del script. |
| `tema` | `temaNombreExistente` si no es `null` (coherencia con la carpeta); si no, el tema tal cual lo dio el usuario. |
| `orden` | El número, sin ceros a la izquierda. |
| `fecha` | `fecha` del script. |
| `resumen` | 1-2 frases, máximo ~220 caracteres, entre comillas. |
| `conceptos` | Entre 3 y 8, de 1 a 4 palabras cada uno. |
| `idiomaOriginal` | Código ISO 639-1 del original (`en`, `es`…). |
| `original` | `rutas.original`. |

**Cuerpo:** las seis secciones de la plantilla, en ese orden y con esos títulos exactos
(`## TL;DR`, `## Conceptos clave`, `## Explicación`, `## Esquema`, `## Glosario`,
`## Preguntas de repaso`). Una sección solo se omite si de verdad no hay material para ella.

Reglas de contenido:

- **Traduce y condensa; no traduzcas literal.** Reorganiza por ideas con subtítulos
  propios (`###`) dentro de `## Explicación`. Elimina relleno motivacional
  («¡lo estás haciendo genial!», «in this lesson we will…»), repeticiones y enlaces de
  navegación del curso.
- **No inventes.** Todo debe salir del original. Si añades contexto para aclarar algo,
  va en un bloque `> **Nota:** …`. Las respuestas de repaso salen solo del apunte.
- **Términos técnicos** habituales en inglés se quedan en inglés (Merkle tree, trie, gas,
  nonce, state root…); la primera vez, con una explicación breve en español.
- **Código:** conserva **todo** el código del original, íntegro y con su lenguaje en la
  valla (```` ```js ````, ```` ```solidity ````…). Solo se traducen los comentarios; no se
  cambian identificadores, cadenas ni lógica.
- **Imágenes:** cualquier imagen del original (`![…](…)`, nombres sueltos como
  `eth-block`, líneas tipo «Image: …», etiquetas de figura) se sustituye por un diagrama
  Mermaid o una tabla equivalente **si el texto de alrededor permite saber qué mostraba**;
  si no, se omite. Nunca queda una referencia rota ni una imagen inventada. Apunta cada
  una para el resumen final.
- **Esquema:** al menos un diagrama Mermaid o una tabla comparativa cuando el tema lo
  permita.
- **Mermaid seguro:** etiquetas de nodo siempre entre comillas (`A["Texto (con) signos"]`),
  ids de nodo alfanuméricos simples (`A`, `B1`, nunca `end`), sin `;` al final de línea,
  flechas `-->` y etiquetas de flecha con `-- texto -->`. Prefiere `flowchart TD`/`LR`.
- **Preguntas de repaso:** 3-5, lista numerada, cada respuesta en un `<details>` con
  `<summary>Ver respuesta</summary>`, sangrado de 3 espacios y líneas en blanco
  alrededor del contenido (como en la plantilla), o el Markdown interior no se renderiza.
- **Glosario:** solo términos técnicos nuevos del apunte: `**Término**: explicación`.

## 5. Validar con el build

Ejecuta `pnpm build`.

- Si falla por el apunte (esquema, YAML, Markdown), **corrige el apunte, nunca el
  esquema** ni `src/content.config.ts`, y repite hasta que pase.
- Si tras 3 intentos sigue fallando, o falla por algo ajeno al apunte, para y enseña el
  error.
- Comprueba también que la salida no tiene warnings nuevos.

## 6. Resumen final

Termina con un resumen breve, sin hacer commit:

- Ruta del apunte y del original.
- Número de orden (y si se ha sobrescrito uno existente).
- Conceptos del frontmatter.
- Imágenes: cuáles se han sustituido (por qué diagrama o tabla) y cuáles se han omitido.
  Si no había, dilo.
- Notas propias añadidas (`> **Nota:**`), si las hay.
- Mensaje de commit propuesto:
  `content(<bootcamp>): añade apunte de <título>`
  (si se sobrescribe: `content(<bootcamp>): actualiza apunte de <título>`).
