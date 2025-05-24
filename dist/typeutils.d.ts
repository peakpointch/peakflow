export type CamelToDash<T extends string> = T extends `${infer Head}${infer Tail}` ? Head extends Lowercase<Head> ? `${Head}${CamelToDash<Tail>}` : `-${Lowercase<Head>}${CamelToDash<Tail>}` : T;
export type DashToCamelCase<T extends string> = T extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<DashToCamelCase<Tail>>}` : T;
