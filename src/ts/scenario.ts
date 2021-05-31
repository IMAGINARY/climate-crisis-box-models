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

  setParameter(value: number);
  getParameter(): number;
  getParameterRange(): { min: number; max: number };

  reset(): void;
}

export type SimulationResult = [number, Record];
export type SimulationResults = SimulationResult[];

export type Simulation = {
  model: BoxModelForScenario;
  results: SimulationResults;
};
