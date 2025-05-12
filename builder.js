import esbuild from "esbuild";
import fg from "fast-glob";

// Build all files inside src/
async function buildLibrary() {
  const files = await fg("src/**/*.ts");

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
