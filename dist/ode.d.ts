export declare type IVPIntegrator = (y: number[], x: number, h: number, derivatives: (y: number[], x: number) => number[]) => number[];
export declare function euler(y: number[], x: number, h: number, derivatives: (y: number[], x: number) => number[]): number[];
export declare function rk4(y: number[], x: number, h: number, derivatives: (y: number[], x: number) => number[]): number[];
