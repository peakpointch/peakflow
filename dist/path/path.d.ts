export declare class Path {
    private _path;
    constructor(initialPath?: string | number);
    up(): Path;
    peekUp(): string;
    down(segment: string | number): Path;
    peekDown(segment: string | number): string;
    downSafe(segment: string | number | null | undefined): Path;
    private _peekDown;
    sibling(segment: string | number): Path;
    peekSibling(segment: string | number): string;
    restore(path: string | number): Path;
    snapshot(): string;
    leaf(): string;
    prefix(path: string | number): Path;
    peekPrefix(path: string | number): string;
    withPath<T>(path: string | number, callback: (path: Path) => T, options?: {
        keepPath: boolean;
    }): T;
    withSegment<T>(segment: string | number, callback: (path: Path) => T, options?: {
        keepSegment: boolean;
    }): T;
    withSnapshot<T>(callback: (path: Path) => T): T;
    s(): string;
    toString(): string;
    static isValid(path: string | number | null | undefined): path is string | number;
    static isValidSegment(segment: string | number | null | undefined): segment is string | number;
    static assertValid(segment: string | number | null | undefined): asserts segment is string | number;
    static assertValidSegment(segment: string | number | null | undefined): asserts segment is string | number;
}
