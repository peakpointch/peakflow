export class Path {
    constructor(initialPath = "") {
        this._path = "";
        this._path = initialPath;
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
        this.validate(segment);
        this._path = this._peekDown(segment);
        return this;
    }
    peekDown(segment) {
        this.validate(segment);
        return this._peekDown(segment);
    }
    downSafe(segment) {
        if (!segment)
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
        return this.withSnapshot((path) => {
            return path.up().down(segment).toString();
        });
    }
    restore(path) {
        this._path = path;
        return this;
    }
    snapshot() {
        return this._path;
    }
    leaf() {
        const idx = this._path.lastIndexOf(".");
        return idx >= 0 ? this._path.slice(idx + 1) : "";
    }
    prefix(path) {
        this._path = this.peekPrefix(path);
        return this;
    }
    peekPrefix(path) {
        if (!path)
            return this._path;
        this.validate(path);
        return `${path}.${this._path}`;
    }
    withPath(path, callback, options = { keepPath: false }) {
        this.validate(path);
        const snapshot = this.snapshot();
        this._path = path;
        try {
            return callback(this);
        }
        finally {
            this.restore(options.keepPath ? path : snapshot);
        }
    }
    withSegment(segment, callback, options = { keepSegment: false }) {
        this.validate(segment);
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
    validate(segment) {
        if (!segment || /\s/.test(segment))
            throw new Error(`Invalid path segment: "${segment}"`);
    }
}
