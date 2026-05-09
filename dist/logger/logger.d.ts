import { type LogLevelNames } from "loglevel";
export declare class Logger {
    private logger;
    readonly name: string;
    instance: string;
    constructor(name: string, level?: LogLevelNames);
    setLevel(level: LogLevelNames): void;
    trace(...msg: any[]): void;
    debug(...msg: any[]): void;
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    error(...msg: any[]): void;
    private get prefix();
}
export default Logger;
