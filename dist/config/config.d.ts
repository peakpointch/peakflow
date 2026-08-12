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
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const environmentSchema: z.ZodObject<{
    name: z.ZodString;
    skip: z.ZodDefault<z.ZodBoolean>;
    modules: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        file: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>]>>>;
    version: z.ZodString;
    pages: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
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
    environments: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        skip: z.ZodDefault<z.ZodBoolean>;
        modules: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            file: z.ZodString;
            version: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>]>>>;
        version: z.ZodString;
        pages: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
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
    repository: RawPeakflowRepo;
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
    devServer: RawPeakflowDevServer;
    /**
     * Build configuration before defaults are applied.
     *
     * @property modules Entry modules to build. Defaults to `["./src/index.ts"]`.
     * @property outdir Directory where build output is written. Defaults to `"./dist"`.
     */
    build?: RawPeakflowBuild;
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
export declare function defineConfig(config: RawPeakflowConfig): RawPeakflowConfig;
export {};
