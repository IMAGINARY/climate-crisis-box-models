import { Simulation } from './simulation';

export interface Scenario {
  getSimulation(): Simulation;
  getName(): string;
  getContainer(): HTMLDivElement;
  getScene(): HTMLDivElement;
  getOverlay(): HTMLDivElement;
  reset(): void;
  hide(): void;
  show(): void;
  isVisible(): boolean;
  tweenIn(): Promise<void>;
  tweenOut(): Promise<void>;
  hideOverlay(): void;
  showOverlay(): void;
  isOverlayVisible(): boolean;
}
