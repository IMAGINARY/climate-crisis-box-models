import { Simulation } from './simulation';

export interface Scenario {
  getSimulation(): Simulation;
  tweenIn(): Promise<void>;
  tweenOut(): Promise<void>;
}
