import { z } from "zod";
declare const repositorySchema: z.ZodObject<{
    owner: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
declare const devServerSchema: z.ZodObject<{
    webflowSubdomain: z.ZodString;
    port: z.ZodDefault<z.ZodNumber>;
    livereload: z.ZodDefault<z.ZodBoolean>;
    watchList: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
declare const buildSchema: z.ZodPrefault<z.ZodObject<{
    modules: z.ZodDefault<z.ZodArray<z.ZodString>>;
    outdir: z.ZodDefault<z.ZodString>;
}, z.core.$strip>>;
declare const moduleSchema: z.ZodObject<{
    file: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
declare const environmentSchema: z.ZodPipe<z.ZodObject<{
    name: z.ZodString;
    skip: z.ZodDefault<z.ZodBoolean>;
    modules: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        file: z.ZodString;
        version: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>]>>>;
    version: z.ZodString;
    pages: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, z.ZodTransform<{
    name: string;
    skip: boolean;
    pages: string[];
    version: string;
    modules: {
        file: string;
        version: string;
    }[];
}, {
    name: string;
    skip: boolean;
    modules: (string | {
        file: string;
        version: string;
    })[];
    version: string;
    pages: string[];
}>>;
/**
 * The `PeakflowConfig` runtime schema used for config validation.
 */
export declare const configSchema: z.ZodObject<{
    repository: z.ZodObject<{
        owner: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>;
    devServer: z.ZodObject<{
        webflowSubdomain: z.ZodString;
        port: z.ZodDefault<z.ZodNumber>;
        livereload: z.ZodDefault<z.ZodBoolean>;
        watchList: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    build: z.ZodPrefault<z.ZodObject<{
        modules: z.ZodDefault<z.ZodArray<z.ZodString>>;
        outdir: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    environments: z.ZodDefault<z.ZodArray<z.ZodPipe<z.ZodObject<{
        name: z.ZodString;
        skip: z.ZodDefault<z.ZodBoolean>;
        modules: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            file: z.ZodString;
            version: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>]>>>;
        version: z.ZodString;
        pages: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>, z.ZodTransform<{
        name: string;
        skip: boolean;
        pages: string[];
        version: string;
        modules: {
            file: string;
            version: string;
        }[];
    }, {
        name: string;
        skip: boolean;
        modules: (string | {
            file: string;
            version: string;
        })[];
        version: string;
        pages: string[];
    }>>>>;
}, z.core.$strip>;
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
export declare function defineConfig(config: RawPeakflowConfig): RawPeakflowConfig;
export {};
