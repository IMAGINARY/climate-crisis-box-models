import { Simulation } from './simulation';

export interface Scenario {
  getSimulation(): Simulation;
  getName(): string;
  getContainer(): HTMLDivElement;
  getScene(): HTMLDivElement;
  reset(): void;
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  tweenIn(): Promise<void>;
  tweenOut(): Promise<void>;
  enableMathMode(visible: boolean): void;
  isMathModeEnabled(): boolean;
}
