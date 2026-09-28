import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Un .json por bootcamp; el id es el nombre del fichero (p. ej. «alchemy-ethereum»).
const bootcamps = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/bootcamps' }),
	schema: z.object({
		nombre: z.string().min(1),
		plataforma: z.string().min(1),
		url: z.url().optional(),
		estado: z.enum(['en-curso', 'terminado', 'pausado']),
		color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un hex de 6 dígitos, p. ej. #4f5fe0'),
		inicio: z.coerce.date().optional(),
	}),
});

// Apuntes en <bootcamp>/<tema>/<nn>-<titulo>.md; el id es esa ruta sin extensión.
const apuntes = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/apuntes' }),
	schema: z.object({
		titulo: z.string().min(1),
		bootcamp: reference('bootcamps'),
		tema: z.string().min(1),
		orden: z.number().int().positive(),
		fecha: z.coerce.date(),
		resumen: z.string().min(1),
		conceptos: z.array(z.string().min(1)).min(3).max(8),
		idiomaOriginal: z.string().min(2),
		original: z.string().optional(),
	}),
});

export const collections = { bootcamps, apuntes };
