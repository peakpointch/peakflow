#!/usr/bin/env node

import { mkdirSync, writeFileSync, existsSync } from "fs";

const moduleName = process.argv[2];

if (!moduleName) {
  console.error("❌ Please provide a module name: npm run create-module <name>");
  process.exit(1);
}

const basePath = `src/${moduleName}`;
if (existsSync(basePath)) {
  console.error(`❌ Module '${moduleName}' already exists.`);
  process.exit(1);
}

// create directory
mkdirSync(basePath, { recursive: true });

// create files
writeFileSync(`${basePath}/index.ts`, `export * from './${moduleName}';\n`);
writeFileSync(`${basePath}/${moduleName}.ts`, `// ${moduleName} module\n`);

console.log(`✅ Created module '${moduleName}' in ${basePath}`);
