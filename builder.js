import esbuild from "esbuild";
import fs from "fs";
import path from "path";

// Build all files inside src/
async function buildLibrary() {
  const files = await glob("src/**/*.ts");

  await esbuild.build({
    entryPoints: files,
    outdir: "dist",
    bundle: false,
    format: "esm",
    sourcemap: false,
    minify: false,
    target: ["es2020"],
    outbase: "src",
  });
}

buildLibrary().catch(() => process.exit(1));
