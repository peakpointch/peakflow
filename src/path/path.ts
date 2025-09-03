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

  public withSegment(
    segment: string,
    callback: (path: Path) => void,
    options: { keepSegment: boolean } = { keepSegment: false },
  ) {
    this.validate(segment);
    const snapshot = this.snapshot();
    this.down(segment);
    const segmentSnapshot = this.snapshot();
    try {
      callback(this);
    } finally {
      this.restore(options.keepSegment ? segmentSnapshot : snapshot);
    }
  }

  public withSnapshot(callback: (path: Path) => void) {
    const snapshot = this.snapshot();
    try {
      callback(this);
    } finally {
      this.restore(snapshot);
    }
  }

  public toString(): string {
    return this._path;
  }

  private validate(segment: string): void {
    if (!segment || /\s/.test(segment)) throw new Error(`Invalid path segment: "${segment}"`);
  }
}
