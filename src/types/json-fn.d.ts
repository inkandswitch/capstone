declare module 'json-fn' {
  export function clone(obj: any, date2obj?: boolean): any;
  export function stringify(obj: any): string;
  export function parse(str: string, date2obj?: boolean): any;
}
