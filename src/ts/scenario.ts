import { Simulation } from './simulation';

export interface Scenario {
  getSimulation(): Simulation;
  getName(): string;
  reset(): void;
  hide(): void;
  show(): void;
  tweenIn(): Promise<void>;
  tweenOut(): Promise<void>;
}
