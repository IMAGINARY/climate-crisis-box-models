import { IVPIntegrator, euler, rk4 } from './ode';
export { IVPIntegrator, euler, rk4 };
declare type LookupFunction = (id: string) => number;
export declare type Equation = (s: LookupFunction, f: LookupFunction, v: LookupFunction, c: LookupFunction, t: number) => number;
export interface Stock {
    readonly id: string;
    readonly in: ReadonlyArray<string>;
    readonly out: ReadonlyArray<string>;
}
export interface Flow {
    readonly id: string;
    readonly equation: Equation;
}
export interface Variable {
    readonly id: string;
    readonly equation: Equation;
}
export interface Constant {
    readonly id: string;
    value: number;
}
export interface Record {
    stocks: number[];
    flows: number[];
    variables: number[];
    constants: number[];
}
export default class BoxModel {
    readonly stocks: ReadonlyArray<Stock>;
    readonly flows: ReadonlyArray<Flow>;
    readonly variables: ReadonlyArray<Variable>;
    readonly constants: ReadonlyArray<Constant>;
    integrator: IVPIntegrator;
    protected idToIdx: {
        [key: string]: number;
    };
    constructor({ stocks, flows, variables, constants, }: {
        stocks: Stock[];
        flows: Flow[];
        variables: Variable[];
        constants: Constant[];
    }, integrator?: IVPIntegrator);
    protected ensureUniqueIds(): void;
    static createIdToIdxMap(arr: Array<{
        id: string;
    }>): {};
    evaluateGraph(stocks: number[], t: number): Record;
    step(initialStockValues: number[], t: number, h: number): number[];
    stepExt(initialStockValues: number[], t: number, h: number): Record;
}
export { BoxModel };
