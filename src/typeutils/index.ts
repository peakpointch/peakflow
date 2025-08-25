export type CamelToDash<T extends string> = T extends `${infer Head}${infer Tail}`
  ? Head extends Lowercase<Head> // First character is lowercase
    ? `${Head}${CamelToDash<Tail>}` // If it is lowercase, continue as normal
    : `-${Lowercase<Head>}${CamelToDash<Tail>}` // If it's uppercase, add a dash and make it lowercase
  : T;

export type DashToCamelCase<T extends string> = T extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<DashToCamelCase<Tail>>}` // Capitalize the first character of Tail
  : T;
