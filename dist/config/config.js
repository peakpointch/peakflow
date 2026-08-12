import { z } from "zod";
const repositorySchema = z
    .object({
    owner: z.string().nonempty(),
    name: z.string().nonempty(),
});
const devServerSchema = z
    .object({
    webflowSubdomain: z.string({
        error: `Missing required property "devServer.webflowSubdomain".`,
    }).nonempty(),
    port: z.number().int().min(1).max(65535).default(3000),
    livereload: z.boolean().default(true),
    watchList: z.array(z.string()).default(["./src"]),
});
const buildSchema = z.object({
    modules: z.array(z.string()).default([]),
    outdir: z.string().default("./dist"),
}).prefault({});
const moduleSchema = z.object({
    file: z.string().nonempty(),
    version: z.string().optional(),
});
const environmentSchema = z.object({
    name: z.string().nonempty(),
    skip: z.boolean().default(false),
    modules: z.array(z.union([z.string(), moduleSchema])).default([]),
    version: z.string(),
    pages: z.array(z.string()).default([]),
});
/**
 * The `PeakflowConfig` runtime schema used for config validation.
 */
export const configSchema = z.object({
    repository: repositorySchema,
    devServer: devServerSchema,
    build: buildSchema,
    environments: z.array(environmentSchema).default([]).optional(),
});
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
 *       pages: ["/**"],
 *     },
 *   ],
 * });
 * ```
 */
export function defineConfig(config) {
    return config;
}
