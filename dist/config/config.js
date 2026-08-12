import { z } from "zod";
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
    version: z.string().optional(),
});
const environmentSchema = z
    .object({
    name: z.string().nonempty(),
    skip: z.boolean().default(false),
    modules: z.array(z.union([z.string(), moduleSchema])).default([]),
    version: z.string(),
    pages: z.array(z.string()).default([]),
})
    .transform(({ modules, version, ...environment }) => ({
    ...environment,
    version,
    modules: modules.map((module) => ({
        file: typeof module === "string" ? module : module.file,
        version: typeof module === "string" ? version : (module.version ?? version),
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
export function defineConfig(config) {
    return config;
}
