export declare class Path {
    private _path;
    constructor(initialPath?: string);
    up(): Path;
    peekUp(): string;
    down(segment: string): Path;
    peekDown(segment: string): string;
    downSafe(segment: string | null | undefined): Path;
    private _peekDown;
    sibling(segment: string): Path;
    peekSibling(segment: string): string;
    restore(path: string): Path;
    snapshot(): string;
    leaf(): string;
    prefix(path: string): Path;
    peekPrefix(path: string): string;
    withPath<T>(path: string, callback: (path: Path) => T, options?: {
        keepPath: boolean;
    }): T;
    withSegment<T>(segment: string, callback: (path: Path) => T, options?: {
        keepSegment: boolean;
    }): T;
    withSnapshot<T>(callback: (path: Path) => T): T;
    s(): string;
    toString(): string;
    private validate;
}
