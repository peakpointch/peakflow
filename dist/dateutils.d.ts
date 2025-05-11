export type DateOptionsObject = {
    [key: string]: Intl.DateTimeFormatOptions;
};
export declare function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions): string;
export declare function addDays(date: Date, days: number): Date;
export declare function getMonday(date?: Date, week?: number): Date;
