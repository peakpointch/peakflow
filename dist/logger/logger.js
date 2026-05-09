import log, {} from "loglevel";
export class Logger {
    constructor(name, level = "warn") {
        this.name = name;
        this.logger = log.getLogger(name);
        this.logger.setLevel(level);
    }
    setLevel(level) {
        this.logger.setLevel(level);
    }
    trace(...msg) {
        this.logger.trace(this.prefix, ...msg);
    }
    debug(...msg) {
        this.logger.debug(this.prefix, ...msg);
    }
    info(...msg) {
        this.logger.info(this.prefix, ...msg);
    }
    warn(...msg) {
        this.logger.warn(this.prefix, ...msg);
    }
    error(...msg) {
        this.logger.error(this.prefix, ...msg);
    }
    get prefix() {
        const instanceStr = this.instance ? ` "${this.instance}"` : "";
        return `${this.name}${instanceStr}:`;
    }
}
export default Logger;
