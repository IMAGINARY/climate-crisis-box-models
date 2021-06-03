import { SimulationResult } from './simulation';

export default interface Chart {
  update(results: SimulationResult[]): void;
  reset(): void;
}

export { Chart };
