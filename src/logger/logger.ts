import log from "loglevel";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "silent";

export class Logger {
  private logger: log.Logger;
  public readonly name: string;
  public instance: string;

  constructor(name: string, level: LogLevel = "warn") {
    this.name = name;
    this.logger = log.getLogger(name);
    this.logger.setLevel(level);
  }

  public setLevel(level: LogLevel): void {
    this.logger.setLevel(level);
  }

  public debug(...msg: any[]): void {
    this.logger.debug(this.prefix, ...msg);
  }

  public info(...msg: any[]): void {
    this.logger.info(this.prefix, ...msg);
  }

  public warn(...msg: any[]): void {
    this.logger.warn(this.prefix, ...msg);
  }

  public error(...msg: any[]): void {
    this.logger.error(this.prefix, ...msg);
  }

  private get prefix(): string {
    const instanceStr = this.instance ? ` "${this.instance}"` : "";
    return `${this.name}${instanceStr}:`;
  }
}
