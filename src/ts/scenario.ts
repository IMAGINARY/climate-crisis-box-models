import { BoxModelForScenario } from './box-model-definition';
import { Record } from './box-model';

export interface ScenarioView {
  readonly simulation: Simulation;
  update(): void;
  tweenIn(): Promise<void>;
  tweenOut(): Promise<void>;
  animate(on: boolean): void;
  isAnimating(): boolean;
}

export interface ScenarioController {
  start(): Promise<void>;
  play(): void;
  pause(): void;
  stop(): Promise<void>;
  isPlaying(): boolean;

  /***
   * Set the relative value of the first parameter of the model.
   * @param t A number in [0,1] to interpolate between the model parameter's minimum and maximum.
   */
  setParameter(t: number);
  getParameter(): number;
  reset(): void;
}

export type SimulationResult = [number, Record];
export type SimulationResults = SimulationResult[];

export type Simulation = {
  model: BoxModelForScenario;
  results: SimulationResults;
};
