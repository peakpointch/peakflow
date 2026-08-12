import { z } from "zod";
import type { Equal, Expect } from "../typeutils";

/* ======================== */
/* ==== Runtime Schema ==== */
/* ======================== */

const repositorySchema = z.object({
  owner: z.string().nonempty(),
  name: z.string().nonempty(),
});

const devServerSchema = z.object({
  webflowSubdomain: z
    .string({
      error: `Missing required property "devServer.webflowSubdomain".`,
    })
    .nonempty(),
  port: z.number().int().min(1).max(65535).default(3000),
  livereload: z.boolean().default(true),
  watchList: z.array(z.string()).default(["./src"]),
});

const buildSchema = z
  .object({
    modules: z.array(z.string()).default([]),
    outdir: z.string().default("./dist"),
  })
  .prefault({});

const moduleSchema = z.object({
  file: z.string().nonempty(),
  version: z.string().default(""),
});

const environmentSchema = z
  .object({
    name: z.string().nonempty(),
    skip: z.boolean().default(false),
    modules: z.array(z.union([z.string(), moduleSchema])).default([]),
    version: z.string().trim(),
    pages: z.array(z.string()).default([]),
  })
  .transform(({ modules, version, ...environment }) => ({
    ...environment,
    version,
    modules: modules.map((module) => ({
      file: typeof module === "string" ? module : module.file,
      version: typeof module === "string" ? version : module.version.trim() || version,
    })),
  }));

/**
 * The `PeakflowConfig` runtime schema used for config validation.
 */
export const configSchema = z.object({
  repository: repositorySchema,
  devServer: devServerSchema,
  build: buildSchema,
  environments: z.array(environmentSchema).default([]),
});

/* ====================== */
/* ==== Output Types ==== */
/* ====================== */

export type PeakflowRepo = z.output<typeof repositorySchema>;
export type PeakflowDevServer = z.output<typeof devServerSchema>;
export type PeakflowBuild = z.output<typeof buildSchema>;
export type PeakflowModule = z.output<typeof moduleSchema>;
export type PeakflowEnv = z.output<typeof environmentSchema>;

/**
 * Sanitized configuration for a Peakflow app.
 *
 * Represents the configuration after validation and default values have
 * been applied by `configSchema`.
 */
export type PeakflowConfig = z.output<typeof configSchema>;

/* ===================== */
/* ==== Input Types ==== */
/* ===================== */

export type RawPeakflowRepo = z.input<typeof repositorySchema>;
export type RawPeakflowDevServer = z.input<typeof devServerSchema>;
export type RawPeakflowBuild = z.input<typeof buildSchema>;
export type RawPeakflowEnv = z.input<typeof environmentSchema>;

/**
 * Unsanitized configuration for a Peakflow app.
 *
 * Represents the configuration as authored by the user, before validation
 * and defaults are applied.
 */
export type RawPeakflowConfig = {
  /**
   * The GitHub repository of your project. This is used to construct the
   * JSDelivr URLs from which your production modules are served.
   *
   * @property owner The GitHub username or organization that owns the repository.
   * @property name The name of the GitHub repository.
   */
  repository: RawPeakflowRepo;
  /**
   * Development server configuration.
   *
   * @property webflowSubdomain The Webflow subdomain to proxy during development.
   * @property port The local development server port. Default: `3000`.
   * @property livereload Whether livereload is enabled. Default: `true`.
   * @property watchList Paths watched for changes. Default: `["./src"]`.
   */
  devServer: RawPeakflowDevServer;
  /**
   * Build configuration.
   *
   * @property modules Files to build. Default: `[]`.
   * @property outdir Directory where build output is written. Default: `"./dist"`.
   */
  build?: RawPeakflowBuild;
  /**
   * A Peakflow publishing environment.
   *
   * @property name The name of the environment.
   * @property modules The built modules (files) included in the environment.
   * @property version The version associated with the environment, used as a
   *           fallback for all modules.
   * @property pages Page patterns (literal path, Glob, ExtGlob) that match
   *           against published pages of your Webflow site.
   */
  environments?: RawPeakflowEnv[];
};

/**
 * Compile-time assertion ensuring that `RawPeakflowConfig` stays in sync
 * with the input accepted by `configSchema`.
 */
type _InputMatches = Expect<Equal<RawPeakflowConfig, z.input<typeof configSchema>>>;

/**
 * Define the configuration for a Peakflow project (type wrapper only).
 *
 * - Read the docs at https://github.com/peakpointch/peakflow-cli.
 * - See JSDoc of config properties for more information.
 *
 * @param config The unsanitized Peakflow configuration.
 * @returns The configuration unchanged.
 *
 * @example
 * ```typescript
 * export default defineConfig({
 *   repository: {
 *     owner: "peakpointch",
 *     name: "peakpoint",
 *   },
 *   devServer: {
 *     webflowSubdomain: "peakpoint",
 *     port: 3000,
 *     livereload: true,
 *     watchList: ["./src", "./public"],
 *   },
 *   build: {
 *     modules: ["./src/index.ts", "./src/marketing.ts"],
 *     outdir: "./dist",
 *   },
 *   environments: [
 *     {
 *       name: "production",
 *       version: "1.2.0",
 *       modules: ["./src/index.ts"],
 *       pages: ["/", "/**\/*"],
 *     },
 *   ],
 * });
 * ```
 */
export function defineConfig(config: RawPeakflowConfig): RawPeakflowConfig {
  return config;
}
