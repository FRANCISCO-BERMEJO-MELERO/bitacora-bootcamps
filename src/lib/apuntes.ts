import { getCollection, type CollectionEntry } from 'astro:content';

export type Bootcamp = CollectionEntry<'bootcamps'>;
export type Apunte = CollectionEntry<'apuntes'>;
export type Estado = Bootcamp['data']['estado'];

export interface Tema {
	nombre: string;
	slug: string;
	apuntes: Apunte[];
}

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
	'en-curso': 'En curso',
	terminado: 'Terminado',
	pausado: 'Pausado',
};

export async function getBootcamps(): Promise<Bootcamp[]> {
	const bootcamps = await getCollection('bootcamps');
	return bootcamps.sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
}

/** Segmentos de la ruta del apunte: [bootcamp, tema, fichero]. */
function segmentos(apunte: Apunte): string[] {
	return apunte.id.split('/');
}

/** Ruta del apunte dentro de su bootcamp (el id sin el prefijo del bootcamp). */
export function slugDe(apunte: Apunte): string {
	return segmentos(apunte).slice(1).join('/');
}

export function hrefDe(apunte: Apunte): string {
	return `/${apunte.data.bootcamp.id}/${slugDe(apunte)}/`;
}

/** Comprueba que la estructura de carpetas y el frontmatter cuentan lo mismo. */
function validar(apuntes: Apunte[]): void {
	const errores: string[] = [];
	const vistos = new Map<string, string>();

	for (const apunte of apuntes) {
		const [carpetaBootcamp, carpetaTema, fichero] = segmentos(apunte);
		if (!fichero) {
			errores.push(`«${apunte.id}» debe estar en <bootcamp>/<tema>/<nn>-<titulo>.md`);
			continue;
		}
		if (carpetaBootcamp !== apunte.data.bootcamp.id) {
			errores.push(
				`«${apunte.id}» está en la carpeta «${carpetaBootcamp}» pero su frontmatter dice bootcamp: ${apunte.data.bootcamp.id}`,
			);
		}
		const clave = `${carpetaBootcamp}/${carpetaTema}#${apunte.data.orden}`;
		const repetido = vistos.get(clave);
		if (repetido) {
			errores.push(`«${apunte.id}» y «${repetido}» comparten orden ${apunte.data.orden} en el mismo tema`);
		}
		vistos.set(clave, apunte.id);
	}

	if (errores.length > 0) {
		throw new Error(`Apuntes incoherentes:\n- ${errores.join('\n- ')}`);
	}
}

let cache: Promise<Apunte[]> | undefined;

/** Todos los apuntes, validados una sola vez por build. */
export function getApuntes(): Promise<Apunte[]> {
	cache ??= getCollection('apuntes').then((apuntes) => {
		validar(apuntes);
		return apuntes;
	});
	return cache;
}

export async function getApuntesDe(bootcampId: string): Promise<Apunte[]> {
	const apuntes = await getApuntes();
	return apuntes.filter((a) => a.data.bootcamp.id === bootcampId);
}

/**
 * Agrupa por tema (según la carpeta). Los temas se ordenan por la fecha de su
 * primer apunte y, a igualdad, por nombre; los apuntes, por `orden`.
 */
export function agruparPorTema(apuntes: Apunte[]): Tema[] {
	const temas = new Map<string, Tema>();
	for (const apunte of apuntes) {
		const slug = segmentos(apunte)[1];
		const tema = temas.get(slug) ?? { nombre: apunte.data.tema, slug, apuntes: [] };
		tema.apuntes.push(apunte);
		temas.set(slug, tema);
	}

	const primeraFecha = (t: Tema) => Math.min(...t.apuntes.map((a) => a.data.fecha.getTime()));

	return [...temas.values()]
		.map((t) => ({ ...t, apuntes: t.apuntes.sort((a, b) => a.data.orden - b.data.orden) }))
		.sort((a, b) => primeraFecha(a) - primeraFecha(b) || a.nombre.localeCompare(b.nombre, 'es'));
}

export function vecinos(apunte: Apunte, apuntes: Apunte[]): { anterior?: Apunte; siguiente?: Apunte } {
	const tema = agruparPorTema(apuntes).find((t) => t.apuntes.some((a) => a.id === apunte.id));
	if (!tema) return {};
	const i = tema.apuntes.findIndex((a) => a.id === apunte.id);
	return { anterior: tema.apuntes[i - 1], siguiente: tema.apuntes[i + 1] };
}

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC',
});

export function formatearFecha(fecha: Date): string {
	return formatoFecha.format(fecha);
}

export function isoFecha(fecha: Date): string {
	return fecha.toISOString().slice(0, 10);
}

export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
	return `${n} ${n === 1 ? singular : pluralForma}`;
}

export function dosDigitos(n: number): string {
	return String(n).padStart(2, '0');
}
