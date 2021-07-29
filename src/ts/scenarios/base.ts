import { Scenario } from '../scenario';
import { Simulation, SimulationResult } from '../simulation';

export abstract class BaseScenario implements Scenario {
  private readonly simulation: Simulation;
  private readonly container: HTMLDivElement;
  private readonly scene: HTMLDivElement;
  private readonly overlay: HTMLDivElement;

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
    this.simulation.on('results', (results) => this.update(results));
    this.simulation.on('reset', () => this.reset());

    const scenarioLabel = document.createElement('div');
    scenarioLabel.innerText = this.getName();
    scenarioLabel.classList.add('label');
    this.container.appendChild(scenarioLabel);
  }

  abstract reset();

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

  protected abstract update(newResults: SimulationResult[]);

  getSimulation(): Simulation {
    return this.simulation;
  }

  hide() {
    this.container.classList.add('invisible');
  }

  show() {
    this.container.classList.remove('invisible');
  }

  isVisible() {
    return !this.container.classList.contains('invisible');
  }

  tweenIn() {
    // TODO: implement actual tween
    this.show();
    return Promise.resolve();
  }

  tweenOut() {
    // TODO: implement actual tween
    this.hide();
    return Promise.resolve();
  }

  hideOverlay() {
    this.overlay.classList.add('invisible');
  }

  showOverlay() {
    this.overlay.classList.remove('invisible');
  }

  isOverlayVisible() {
    return !this.overlay.classList.contains('invisible');
  }
}
