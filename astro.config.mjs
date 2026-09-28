// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	trailingSlash: 'ignore',
	markdown: {
		syntaxHighlight: {
			type: 'shiki',
			// Mermaid se renderiza en cliente; «math» es la exclusión por defecto de Astro.
			excludeLangs: ['mermaid', 'math'],
		},
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
		},
	},
	// Las fuentes se descargan en el build y se sirven desde el propio sitio.
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Schibsted Grotesk',
			cssVariable: '--fuente-ui',
			weights: ['400 900'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Newsreader',
			cssVariable: '--fuente-lectura',
			weights: ['400 700'],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'JetBrains Mono',
			cssVariable: '--fuente-codigo',
			weights: ['400 600'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'Consolas', 'monospace'],
		},
	],
	vite: {
		plugins: [tailwindcss()],
		build: {
			// Mermaid trae motores de layout grandes (elk, cytoscape) que se cargan de forma
			// diferida solo cuando un diagrama los necesita; no afectan a la carga inicial.
			chunkSizeWarningLimit: 1600,
		},
	},
});
