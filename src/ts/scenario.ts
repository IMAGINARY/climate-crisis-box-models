import { Simulation } from './simulation';

export interface Scenario {
  getSimulation(): Simulation;
  getName(): string;
  getContainer(): HTMLDivElement;
  getScene(): HTMLDivElement;
  getOverlay(): HTMLDivElement;
  reset(): void;
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  tweenIn(): Promise<void>;
  tweenOut(): Promise<void>;
  setOverlayVisible(visible: boolean): void;
  isOverlayVisible(): boolean;
}
