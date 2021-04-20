import { IVPIntegrator, euler, rk4 } from './ode';

export { IVPIntegrator, euler, rk4 };

type LookupFunction = (id: string) => number;

export type Equation = (
  s: LookupFunction,
  f: LookupFunction,
  v: LookupFunction,
  c: LookupFunction,
  t: number
) => number;

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

function duplicates(arr: any[]) {
  return arr.reduce((acc, cur, curIdx, arr) => {
    if (arr.lastIndexOf(cur) !== curIdx) {
      arr.push(cur);
    }
    return acc;
  }, []);
}

function sum(a: Array<number>) {
  return a.reduce((a, c) => a + c, 0);
}

export default class BoxModel {
  public readonly stocks: ReadonlyArray<Stock>;
  public readonly flows: ReadonlyArray<Flow>;
  public readonly variables: ReadonlyArray<Variable>;
  public readonly constants: ReadonlyArray<Constant>;
  public integrator: IVPIntegrator;

  protected idToIdx: { [key: string]: number };

  constructor(
    {
      stocks,
      flows,
      variables,
      constants,
    }: {
      stocks: Stock[];
      flows: Flow[];
      variables: Variable[];
      constants: Constant[];
    },
    integrator: IVPIntegrator = rk4
  ) {
    this.stocks = stocks;
    this.flows = flows;
    this.variables = variables;
    this.constants = constants;
    this.integrator = integrator;

    this.ensureUniqueIds();

    this.idToIdx = {
      ...BoxModel.createIdToIdxMap(stocks),
      ...BoxModel.createIdToIdxMap(variables),
      ...BoxModel.createIdToIdxMap(constants),
      ...BoxModel.createIdToIdxMap(flows),
    };
  }

  protected ensureUniqueIds() {
    const ids = []
      .concat(this.stocks, this.variables, this.constants, this.flows)
      .map((item) => item.id);
    const duplicateIds = duplicates(ids);
    if (duplicateIds.length > 0) {
      throw new Error(`Duplicate ids found: ${duplicateIds}`);
    }
  }

  static createIdToIdxMap(arr: Array<{ id: string }>) {
    const map = {};
    arr.forEach(({ id }, i) => (map[id] = i));
    return map;
  }

  public evaluateGraph(stocks: number[], t: number): Record {
    const s = (id) => stocks[this.idToIdx[id]];

    const constants = this.constants.map(({ value }) => value);
    const c = (id) => constants[this.idToIdx[id]];

    const buildEvaluator = (items) => {
      const data = new Array(items.length);
      return {
        evaluator: (id) => {
          const idx = this.idToIdx[id];
          if (data[idx] === null) {
            throw new Error('Evaluation cycle detected starting at: ${id}');
          }

          if (typeof data[idx] === 'undefined') {
            data[idx] = null; // guard the element for cycle detection
            data[idx] = items[idx].equation(s, f, v, c, t);
          }
          return data[idx];
        },
        data,
      };
    };

    const { evaluator: v, data: variables } = buildEvaluator(this.variables);
    const { evaluator: f, data: flows } = buildEvaluator(this.flows);

    this.variables.forEach(({ id }) => v(id));
    this.flows.forEach(({ id }) => f(id));

    return { stocks, flows, variables, constants };
  }

  public step(initialStockValues: number[], t: number, h: number): number[] {
    return this.stepExt(initialStockValues, t, h).stocks;
  }

  public stepExt(initialStockValues: number[], t: number, h: number): Record {
    const derivs = (y: number[], x: number): number[] => {
      const { flows } = this.evaluateGraph(y, x);

      const f = (id): number => flows[this.idToIdx[id]];
      const addFlows = (flows) => sum(flows.map((id) => f(id)));

      return y.map((_, i) => {
        const inFlow = addFlows(this.stocks[i].in);
        const outFlow = addFlows(this.stocks[i].out);
        return inFlow - outFlow;
      });
    };

    const stocks = this.integrator(initialStockValues, t, h, derivs);
    const { flows, variables, constants } = this.evaluateGraph(stocks, t + h);

    return { stocks, variables, constants, flows };
  }
}

export { BoxModel };
