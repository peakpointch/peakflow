export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "silent";
export declare class Logger {
    private logger;
    readonly name: string;
    instance: string;
    constructor(name: string, level?: LogLevel);
    setLevel(level: LogLevel): void;
    debug(...msg: any[]): void;
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    error(...msg: any[]): void;
    private get prefix();
}
