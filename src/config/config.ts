import { z } from "zod";

const repositorySchema = z
  .object({
    owner: z.string(),
    name: z.string(),
  })
  .required({
    owner: true,
    name: true,
  });

const moduleSchema = z.object({ file: z.string(), version: z.string() });

const environmentSchema = z.object({
  name: z.string(),
  modules: z.array(z.union([z.string(), moduleSchema])),
  version: z.string(),
  pages: z.array(z.string()),
});

const serverSchema = z
  .object({
    webflowSubdomain: z.string({
      error: `Missing required property "server.webflowSubdomain".`,
    }),
    port: z.number().default(3000),
    livereload: z.boolean().default(true),
    watchList: z.array(z.string()).default(["./src"]),
  })
  .required({ webflowSubdomain: true });

/**
 * The `PeakflowConfig` runtime schema used for config validation.
 */
export const configSchema = z.object({
  repository: repositorySchema,
  build: z.object({
    modules: z.array(z.string()).default(["./src/index.ts"]),
    outdir: z.string().default("./dist"),
  }),
  server: serverSchema,
  environments: z.array(environmentSchema).default([]),
});

export type PeakflowRepo = z.infer<typeof repositorySchema>;
export type PeakflowServer = z.infer<typeof serverSchema>;
export type PeakflowEnv = z.infer<typeof environmentSchema>;
export type PeakflowModule = z.infer<typeof moduleSchema>;

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
