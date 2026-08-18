export class Path {
  private _path: string = "";

  constructor(initialPath: string = "") {
    this._path = initialPath;
  }

  public up(): Path {
    this._path = this.peekUp();
    return this;
  }

  public peekUp(): string {
    const idx = this._path.lastIndexOf(".");
    return idx >= 0 ? this._path.slice(0, idx) : "";
  }

  public down(segment: string): Path {
    this.validate(segment);
    this._path = this._peekDown(segment);
    return this;
  }

  public peekDown(segment: string): string {
    this.validate(segment);
    return this._peekDown(segment);
  }

  public downSafe(segment: string | null | undefined): Path {
    if (!segment) return this;
    return this.down(segment);
  }

  private _peekDown(segment: string): string {
    return this._path ? `${this._path}.${segment}` : segment;
  }

  public sibling(segment: string): Path {
    return this.up().down(segment);
  }

  public peekSibling(segment: string): string {
    return this.withSnapshot((path) => {
      return path.up().down(segment).toString();
    });
  }

  public restore(path: string): Path {
    this._path = path;
    return this;
  }

  public snapshot(): string {
    return this._path;
  }

  public leaf(): string {
    const idx = this._path.lastIndexOf(".");
    return idx >= 0 ? this._path.slice(idx + 1) : "";
  }

  public prefix(path: string): Path {
    this._path = this.peekPrefix(path);
    return this;
  }

  public peekPrefix(path: string): string {
    if (!path) return this._path;
    this.validate(path);
    return `${path}.${this._path}`;
  }

  public withPath<T>(
    path: string,
    callback: (path: Path) => T,
    options: { keepPath: boolean } = { keepPath: false },
  ): T {
    this.validate(path);
    const snapshot = this.snapshot();
    this._path = path;
    try {
      return callback(this);
    } finally {
      this.restore(options.keepPath ? path : snapshot);
    }
  }

  public withSegment<T>(
    segment: string,
    callback: (path: Path) => T,
    options: { keepSegment: boolean } = { keepSegment: false },
  ): T {
    this.validate(segment);
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

  private validate(segment: string): void {
    if (!segment || /\s/.test(segment)) throw new Error(`Invalid path segment: "${segment}"`);
  }
}
