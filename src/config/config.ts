import { z } from "zod";

/**
 * The `PeakflowConfig` runtime schema used for config validation.
 */
export const configSchema = z.object({
  repository: z
    .object({
      owner: z.string(),
      name: z.string(),
    })
    .required({
      owner: true,
      name: true,
    }),
  build: z.object({
    modules: z.array(z.string()).default(["./src/index.ts"]),
    outdir: z.string().default("./dist"),
  }),
  server: z
    .object({
      webflowSubdomain: z.string({
        error: `Missing required property "server.webflowSubdomain".`,
      }),
      port: z.number().default(3000),
      livereload: z.boolean().default(true),
      watchList: z.array(z.string()).default(["./src"]),
    })
    .required({ webflowSubdomain: true }),
  environments: z
    .record(
      z.string(),
      z.object({
        modules: z.array(
          z.union([z.string(), z.object({ file: z.string(), version: z.string() })]),
        ),
        version: z.string(),
        pages: z.array(z.string()),
      }),
    )
    .default({}),
});

/**
 * Configuration for a peakflow app
 */
export type PeakflowConfig = z.infer<typeof configSchema>;

/**
 * Define the configuration for your peakflow app
 */
export function defineConfig(config: PeakflowConfig): PeakflowConfig {
  return config;
}
