#!/usr/bin/env node
// Calcula slugs, orden y rutas de un apunte nuevo, y detecta duplicados.
// Uso: node .claude/skills/apunte/scripts/preparar.mjs "<bootcamp>" "<tema>" "<título>"
// Imprime un JSON en stdout. No escribe nada en disco.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Minúsculas, sin tildes ni eñes, separado por guiones (reglas del CLAUDE.md). */
export function slugify(texto) {
	return texto
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function leerFrontmatter(ruta) {
	const texto = readFileSync(ruta, 'utf8');
	const bloque = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!bloque) return {};
	const campo = (nombre) => {
		const m = bloque[1].match(new RegExp(`^${nombre}:\\s*(.+)$`, 'm'));
		return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined;
	};
	return { titulo: campo('titulo'), tema: campo('tema'), orden: Number(campo('orden')) };
}

const [bootcampEntrada, temaEntrada, tituloEntrada] = process.argv.slice(2).map((a) => a?.trim());
const faltan = [
	!bootcampEntrada && 'bootcamp',
	!temaEntrada && 'tema',
	!tituloEntrada && 'titulo',
].filter(Boolean);

if (faltan.length > 0) {
	console.log(JSON.stringify({ ok: false, faltan }, null, 2));
	process.exit(0);
}

const raiz = process.cwd();
const bootcamp = slugify(bootcampEntrada);
const tituloSlug = slugify(tituloEntrada);

// Si ya hay una carpeta de tema cuyos apuntes dicen el mismo `tema`, se reutiliza
// aunque su nombre no sea el slug exacto; así un tema no se parte en dos carpetas.
function carpetaDeTema() {
	const slug = slugify(temaEntrada);
	const dirBootcamp = join(raiz, 'src/content/apuntes', bootcamp);
	if (!existsSync(dirBootcamp) || existsSync(join(dirBootcamp, slug))) return slug;
	for (const carpeta of readdirSync(dirBootcamp)) {
		const dir = join(dirBootcamp, carpeta);
		const md = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
		if (md.some((f) => slugify(leerFrontmatter(join(dir, f)).tema ?? '') === slug)) return carpeta;
	}
	return slug;
}
const tema = carpetaDeTema();

const dirBootcamps = join(raiz, 'src/content/bootcamps');
const bootcampsExistentes = existsSync(dirBootcamps)
	? readdirSync(dirBootcamps).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
	: [];

const dirTema = join(raiz, 'src/content/apuntes', bootcamp, tema);
const apuntesTema = existsSync(dirTema)
	? readdirSync(dirTema)
			.filter((f) => f.endsWith('.md'))
			.map((f) => ({ archivo: f, ...leerFrontmatter(join(dirTema, f)) }))
	: [];

const ordenes = apuntesTema.map((a) => a.orden).filter((n) => Number.isInteger(n));
const orden = ordenes.length > 0 ? Math.max(...ordenes) + 1 : 1;
const nn = String(orden).padStart(2, '0');

// Duplicado: mismo título una vez normalizado (ignora mayúsculas y tildes).
const duplicado = apuntesTema.find((a) => a.titulo && slugify(a.titulo) === tituloSlug);

// Nombre del tema ya usado en esa carpeta, para mantenerlo coherente.
const nombresTema = [...new Set(apuntesTema.map((a) => a.tema).filter(Boolean))];

const rutas = (n) => ({
	apunte: `src/content/apuntes/${bootcamp}/${tema}/${n}-${tituloSlug}.md`,
	original: `originales/${bootcamp}/${tema}/${n}-${tituloSlug}.md`,
});

console.log(
	JSON.stringify(
		{
			ok: true,
			bootcamp,
			bootcampExiste: bootcampsExistentes.includes(bootcamp),
			bootcampsExistentes,
			tema,
			temaNombreExistente: nombresTema[0] ?? null,
			tituloSlug,
			orden,
			rutas: rutas(nn),
			duplicado: duplicado
				? {
						archivo: `src/content/apuntes/${bootcamp}/${tema}/${duplicado.archivo}`,
						titulo: duplicado.titulo,
						orden: duplicado.orden,
						// Si se sobrescribe, se reutiliza el mismo archivo (y por tanto el mismo orden).
						rutasSobrescribir: {
							apunte: `src/content/apuntes/${bootcamp}/${tema}/${duplicado.archivo}`,
							original: `originales/${bootcamp}/${tema}/${duplicado.archivo}`,
						},
					}
				: null,
			// Fecha local (no UTC): es la fecha en que se genera el apunte.
			fecha: new Date().toLocaleDateString('sv-SE'),
		},
		null,
		2,
	),
);
