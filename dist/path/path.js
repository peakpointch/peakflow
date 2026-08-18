export class Path {
    constructor(initialPath = "") {
        this._path = "";
        Path.assertValid(initialPath);
        this._path = String(initialPath);
    }
    up() {
        this._path = this.peekUp();
        return this;
    }
    peekUp() {
        const idx = this._path.lastIndexOf(".");
        return idx >= 0 ? this._path.slice(0, idx) : "";
    }
    down(segment) {
        this._path = this.peekDown(segment);
        return this;
    }
    peekDown(segment) {
        Path.assertValidSegment(segment);
        return this._peekDown(String(segment));
    }
    downSafe(segment) {
        if (!Path.isValidSegment(segment))
            return this;
        return this.down(segment);
    }
    _peekDown(segment) {
        return this._path ? `${this._path}.${segment}` : segment;
    }
    sibling(segment) {
        return this.up().down(segment);
    }
    peekSibling(segment) {
        Path.assertValidSegment(segment);
        return this.withSnapshot((path) => {
            return path.up().down(segment).toString();
        });
    }
    restore(path) {
        Path.assertValid(path);
        this._path = String(path);
        return this;
    }
    snapshot() {
        return this._path;
    }
    leaf() {
        const index = this._path.lastIndexOf(".");
        return index >= 0 ? this._path.slice(index + 1) : this._path;
    }
    prefix(path) {
        this._path = this.peekPrefix(path);
        return this;
    }
    peekPrefix(path) {
        Path.assertValid(path);
        if (path === "") {
            return this._path;
        }
        else if (this._path === "") {
            return String(path);
        }
        return `${path}.${this._path}`;
    }
    withPath(path, callback, options = { keepPath: false }) {
        Path.assertValid(path);
        const str = String(path);
        const snapshot = this.snapshot();
        this._path = str;
        try {
            return callback(this);
        }
        finally {
            this.restore(options.keepPath ? str : snapshot);
        }
    }
    withSegment(segment, callback, options = { keepSegment: false }) {
        Path.assertValidSegment(segment);
        const snapshot = this.snapshot();
        this.down(segment);
        const segmentSnapshot = this.snapshot();
        try {
            return callback(this);
        }
        finally {
            this.restore(options.keepSegment ? segmentSnapshot : snapshot);
        }
    }
    withSnapshot(callback) {
        const snapshot = this.snapshot();
        try {
            return callback(this);
        }
        finally {
            this.restore(snapshot);
        }
    }
    s() {
        return this._path;
    }
    toString() {
        return this._path;
    }
    static isValid(path) {
        if (path === null || path === undefined)
            return false;
        if (typeof path === "number") {
            return Number.isInteger(path);
        }
        if (path === "")
            return true;
        return path.split(".").every((segment) => Path.isValidSegment(segment));
    }
    static isValidSegment(segment) {
        if (segment === null || segment === undefined)
            return false;
        if (typeof segment === "number") {
            return Number.isInteger(segment);
        }
        return /^[a-zA-Z0-9_-]+$/.test(segment);
    }
    static assertValid(segment) {
        if (!this.isValid(segment))
            throw new Error(`Invalid path: "${segment}"`);
    }
    static assertValidSegment(segment) {
        if (!this.isValidSegment(segment))
            throw new Error(`Invalid path segment: "${segment}"`);
    }
}
