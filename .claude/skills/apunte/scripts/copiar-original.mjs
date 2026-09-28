#!/usr/bin/env node
// Copia el original byte a byte (sin tocarlo) a su ruta definitiva, creando carpetas.
// Uso: node .claude/skills/apunte/scripts/copiar-original.mjs <origen> <destino>

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [origen, destino] = process.argv.slice(2);

if (!origen || !destino) {
	console.error('Uso: copiar-original.mjs <origen> <destino>');
	process.exit(1);
}
if (!existsSync(origen)) {
	console.error(`No existe el archivo de origen: ${origen}`);
	process.exit(1);
}
if (resolve(origen) === resolve(destino)) {
	console.log(`El original ya está en su sitio: ${destino}`);
	process.exit(0);
}

mkdirSync(dirname(destino), { recursive: true });
copyFileSync(origen, destino);
console.log(`Original copiado en ${destino}`);
