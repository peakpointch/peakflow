export class Path {
  private _path: string = "";

  constructor(initialPath: string | number = "") {
    Path.assertValid(initialPath);
    this._path = String(initialPath);
  }

  public up(): Path {
    this._path = this.peekUp();
    return this;
  }

  public peekUp(): string {
    const idx = this._path.lastIndexOf(".");
    return idx >= 0 ? this._path.slice(0, idx) : "";
  }

  public down(segment: string | number): Path {
    this._path = this.peekDown(segment);
    return this;
  }

  public peekDown(segment: string | number): string {
    Path.assertValidSegment(segment);
    return this._peekDown(String(segment));
  }

  public downSafe(segment: string | number | null | undefined): Path {
    if (!Path.isValidSegment(segment)) return this;
    return this.down(segment);
  }

  private _peekDown(segment: string): string {
    return this._path ? `${this._path}.${segment}` : segment;
  }

  public sibling(segment: string | number): Path {
    return this.up().down(segment);
  }

  public peekSibling(segment: string | number): string {
    Path.assertValidSegment(segment);
    return this.withSnapshot((path) => {
      return path.up().down(segment).toString();
    });
  }

  public restore(path: string | number): Path {
    Path.assertValid(path);
    this._path = String(path);
    return this;
  }

  public snapshot(): string {
    return this._path;
  }

  public leaf(): string {
    const index = this._path.lastIndexOf(".");
    return index >= 0 ? this._path.slice(index + 1) : this._path;
  }

  public prefix(path: string | number): Path {
    this._path = this.peekPrefix(path);
    return this;
  }

  public peekPrefix(path: string | number): string {
    Path.assertValid(path);
    if (path === "") {
      return this._path;
    } else if (this._path === "") {
      return String(path);
    }
    return `${path}.${this._path}`;
  }

  public withPath<T>(
    path: string | number,
    callback: (path: Path) => T,
    options: { keepPath: boolean } = { keepPath: false },
  ): T {
    Path.assertValid(path);
    const str = String(path);
    const snapshot = this.snapshot();
    this._path = str;
    try {
      return callback(this);
    } finally {
      this.restore(options.keepPath ? str : snapshot);
    }
  }

  public withSegment<T>(
    segment: string | number,
    callback: (path: Path) => T,
    options: { keepSegment: boolean } = { keepSegment: false },
  ): T {
    Path.assertValidSegment(segment);
    const snapshot = this.snapshot();
    this.down(segment);
    const segmentSnapshot = this.snapshot();
    try {
      return callback(this);
    } finally {
      this.restore(options.keepSegment ? segmentSnapshot : snapshot);
    }
  }

  public withSnapshot<T>(callback: (path: Path) => T): T {
    const snapshot = this.snapshot();
    try {
      return callback(this);
    } finally {
      this.restore(snapshot);
    }
  }

  public s(): string {
    return this._path;
  }

  public toString(): string {
    return this._path;
  }

  public static isValid(path: string | number | null | undefined): path is string | number {
    if (path === null || path === undefined) return false;
    if (typeof path === "number") {
      return Number.isInteger(path);
    }
    if (path === "") return true;

    return path.split(".").every((segment) => Path.isValidSegment(segment));
  }

  public static isValidSegment(
    segment: string | number | null | undefined,
  ): segment is string | number {
    if (segment === null || segment === undefined) return false;
    if (typeof segment === "number") {
      return Number.isInteger(segment);
    }
    return /^[a-zA-Z0-9_-]+$/.test(segment);
  }

  public static assertValid(
    segment: string | number | null | undefined,
  ): asserts segment is string | number {
    if (!this.isValid(segment)) throw new Error(`Invalid path: "${segment}"`);
  }

  public static assertValidSegment(
    segment: string | number | null | undefined,
  ): asserts segment is string | number {
    if (!this.isValidSegment(segment)) throw new Error(`Invalid path segment: "${segment}"`);
  }
}
