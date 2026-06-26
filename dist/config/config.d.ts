import { z } from "zod";
declare const repositorySchema: z.ZodObject<{
    owner: z.ZodNonOptional<z.ZodString>;
    name: z.ZodNonOptional<z.ZodString>;
}, z.core.$strip>;
declare const moduleSchema: z.ZodObject<{
    file: z.ZodString;
    version: z.ZodString;
}, z.core.$strip>;
declare const environmentSchema: z.ZodObject<{
    name: z.ZodString;
    modules: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        file: z.ZodString;
        version: z.ZodString;
    }, z.core.$strip>]>>;
    version: z.ZodString;
    pages: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
declare const serverSchema: z.ZodObject<{
    webflowSubdomain: z.ZodNonOptional<z.ZodString>;
    port: z.ZodDefault<z.ZodNumber>;
    livereload: z.ZodDefault<z.ZodBoolean>;
    watchList: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/**
 * The `PeakflowConfig` runtime schema used for config validation.
 */
export declare const configSchema: z.ZodObject<{
    repository: z.ZodObject<{
        owner: z.ZodNonOptional<z.ZodString>;
        name: z.ZodNonOptional<z.ZodString>;
    }, z.core.$strip>;
    build: z.ZodObject<{
        modules: z.ZodDefault<z.ZodArray<z.ZodString>>;
        outdir: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    server: z.ZodObject<{
        webflowSubdomain: z.ZodNonOptional<z.ZodString>;
        port: z.ZodDefault<z.ZodNumber>;
        livereload: z.ZodDefault<z.ZodBoolean>;
        watchList: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    environments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        modules: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            file: z.ZodString;
            version: z.ZodString;
        }, z.core.$strip>]>>;
        version: z.ZodString;
        pages: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
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
export declare function defineConfig(config: PeakflowConfig): PeakflowConfig;
export {};
