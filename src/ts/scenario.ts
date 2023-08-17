import { Simulation } from './simulation';

export interface Scenario {
  getSimulation(): Simulation;
  getName(): string;
  getContainer(): HTMLDivElement;
  getScene(): HTMLDivElement;
  reset(): this;
  setVisible(visible: boolean): this;
  isVisible(): boolean;
  enableMathMode(visible: boolean): this;
  toggleMathMode(): this;
  isMathModeEnabled(): boolean;
}
