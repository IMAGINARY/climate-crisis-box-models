import { Scenario } from '../scenario';
import { Simulation, SimulationResult } from '../simulation';
import { Updater } from '../util';

export default abstract class BaseScenario implements Scenario {
  private readonly simulation: Simulation;

  private readonly container: HTMLDivElement;

  private readonly scene: HTMLDivElement;

  private readonly overlay: HTMLDivElement;

  protected readonly updaters: Updater[] = [];

  protected constructor(elem: HTMLDivElement, simulation: Simulation) {
    this.container = document.createElement('div');
    this.container.classList.add('scenario');
    elem.appendChild(this.container);

    this.scene = document.createElement('div');
    this.scene.classList.add('scene');
    this.container.appendChild(this.scene);

    this.overlay = document.createElement('div');
    this.overlay.classList.add('overlay');
    this.container.appendChild(this.overlay);

    this.simulation = simulation;
    this.simulation.on('results', this.update.bind(this));
    this.simulation.on('reset', () => this.reset());

    const scenarioLabel = document.createElement('div');
    scenarioLabel.innerText = this.getName();
    scenarioLabel.classList.add('label');
    this.container.appendChild(scenarioLabel);
  }

  reset() {
    this.updaters.forEach((u) => u.reset());
  }

  abstract getName(): string;

  getContainer() {
    return this.container;
  }

  getScene() {
    return this.scene;
  }

  getOverlay() {
    return this.overlay;
  }

  protected update(newResults: SimulationResult[]): void {
    this.updaters.forEach((u) => u.update(newResults));
  }

  getSimulation(): Simulation {
    return this.simulation;
  }

  setVisible(visible: boolean) {
    if (visible) this.container.classList.remove('invisible');
    else this.container.classList.add('invisible');
  }

  isVisible() {
    return !this.container.classList.contains('invisible');
  }

  tweenIn() {
    // TODO: implement actual tween
    this.setVisible(true);
    return Promise.resolve();
  }

  tweenOut() {
    // TODO: implement actual tween
    this.setVisible(false);
    return Promise.resolve();
  }

  setOverlayVisible(visible: boolean) {
    if (visible) this.overlay.classList.remove('invisible');
    else this.overlay.classList.add('invisible');
  }

  isOverlayVisible() {
    return !this.overlay.classList.contains('invisible');
  }
}

export { BaseScenario };
