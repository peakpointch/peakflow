import { z } from "zod";
import type { Equal, Expect } from "../typeutils";

const repositorySchema = z
  .object({
    owner: z.string(),
    name: z.string(),
  })
  .required({
    owner: true,
    name: true,
  });

const devServerSchema = z
  .object({
    webflowSubdomain: z.string({
      error: `Missing required property "server.webflowSubdomain".`,
    }),
    port: z.number().default(3000),
    livereload: z.boolean().default(true),
    watchList: z.array(z.string()).default(["./src"]),
  })
  .required({ webflowSubdomain: true });

const buildSchema = z.object({
  modules: z.array(z.string()).default(["./src/index.ts"]),
  outdir: z.string().default("./dist"),
});

const moduleSchema = z.object({
  file: z.string(),
  version: z.string(),
});

const environmentSchema = z.object({
  name: z.string(),
  modules: z.array(z.union([z.string(), moduleSchema])),
  version: z.string(),
  pages: z.array(z.string()),
});

/**
 * The `PeakflowConfig` runtime schema used for config validation.
 */
export const configSchema = z.object({
  repository: repositorySchema,
  devServer: devServerSchema,
  build: buildSchema,
  environments: z.array(environmentSchema).default([]),
});

/**
 * The GitHub repository of your project.
 *
 * This is used to construct the JSDelivr URLs from which your production
 * modules are served.
 *
 * @property owner The GitHub username or organization that owns the repository.
 * @property name The name of the GitHub repository.
 *
 * @example
 * ```typescript
 * const repository = {
 *   owner: "peakpointch",
 *   name: "peakpoint",
 * };
 * ```
 */
export type RawPeakflowRepo = z.input<typeof repositorySchema>;

/**
 * Development server configuration.
 *
 * Only `webflowSubdomain` is required. All other properties have defaults
 * applied when the configuration is parsed.
 *
 * @property webflowSubdomain The Webflow subdomain to proxy during development.
 * @property port The local development server port. Defaults to `3000`.
 * @property livereload Whether livereload is enabled. Defaults to `true`.
 * @property watchList Paths watched for changes. Defaults to `["./src"]`.
 */
export type RawPeakflowDevServer = z.input<typeof devServerSchema>;

/**
 * A Peakflow publishing environment.
 *
 * Environments describe which modules and pages belong to a particular
 * versioned deployment.
 *
 * @property name The name of the environment.
 * @property modules Modules included in the environment.
 * @property version The version associated with the environment.
 * @property pages Page patterns to which the environment applies.
 */
export type RawPeakflowEnv = z.input<typeof environmentSchema>;

/**
 * Build configuration before defaults are applied.
 *
 * @property modules Entry modules to build. Defaults to `["./src/index.ts"]`.
 * @property outdir Directory where build output is written. Defaults to `"./dist"`.
 */
export type RawPeakflowBuild = z.input<typeof buildSchema>;

/**
 * Unsanitized configuration for a Peakflow app.
 *
 * Represents the configuration as authored by the user, before validation
 * and defaults are applied.
 */
export type RawPeakflowConfig = {
  repository: RawPeakflowRepo;
  devServer: RawPeakflowDevServer;
  build: RawPeakflowBuild;
  environments?: RawPeakflowEnv[];
};

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

/**
 * Compile-time assertion ensuring that `RawPeakflowConfig` stays in sync
 * with the input accepted by `configSchema`.
 */
type _InputMatches = Expect<
  Equal<RawPeakflowConfig, z.input<typeof configSchema>>
>;

/**
 * Define the configuration for a Peakflow project.
 *
 * Provides type checking and autocomplete when authoring a
 * `peakflow.config.ts` file.
 *
 * This function does not validate, transform, or apply defaults to the
 * configuration. Runtime validation is performed separately using
 * `configSchema`.
 *
 * Properties with defaults may therefore be omitted here. They become
 * required in the sanitized `PeakflowConfig` after parsing.
 *
 * @param config The unsanitized Peakflow configuration.
 * @returns The configuration unchanged.
 *
 * @example
 * ```typescript
 * import { defineConfig } from "peakflow/config";
 *
 * export default defineConfig({
 *   repository: {
 *     owner: "peakpointch",
 *     name: "peakpoint",
 *   },
 *   devServer: {
 *     webflowSubdomain: "peakpoint",
 *   },
 *   build: {},
 * });
 * ```
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
 *     port: 4000,
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
 *       pages: ["/**"],
 *     },
 *   ],
 * });
 * ```
 */
export function defineConfig(config: RawPeakflowConfig): RawPeakflowConfig {
  return config;
}
