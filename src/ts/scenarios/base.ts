import { Scenario } from '../scenario';
import { Simulation, SimulationResult } from '../simulation';
import { Updater } from '../util';

export default abstract class BaseScenario implements Scenario {
  private readonly simulation: Simulation;

  private readonly handleReset: () => void;

  private readonly container: HTMLDivElement;

  private readonly scene: HTMLDivElement;

  private mathMode = false;

  protected readonly updaters: Updater[] = [];

  protected constructor(elem: HTMLDivElement, simulation: Simulation) {
    this.container = document.createElement('div');
    this.container.classList.add('scenario');
    elem.appendChild(this.container);

    this.scene = document.createElement('div');
    this.scene.classList.add('scene');
    this.container.appendChild(this.scene);

    this.handleReset = this.reset.bind(this);
    this.simulation = simulation;
    this.simulation.on('results', this.update.bind(this));
    this.simulation.on('reset', this.handleReset);
  }

  reset(): this {
    this.updaters.forEach((u) => u.reset());
    this.simulation.off('reset', this.handleReset);
    this.simulation.reset();
    this.simulation.on('reset', this.handleReset);
    this.simulation.bootstrap();
    return this;
  }

  abstract getName(): string;

  getContainer() {
    return this.container;
  }

  getScene() {
    return this.scene;
  }

  abstract getMathModeElements(): {
    hide: ReadonlyArray<Element>;
    show: ReadonlyArray<Element>;
  };

  protected update(newResults: SimulationResult[]): void {
    this.updaters.forEach((u) => u.update(newResults));
  }

  getSimulation(): Simulation {
    return this.simulation;
  }

  setVisible(visible: boolean): this {
    if (visible) this.container.classList.remove('invisible');
    else this.container.classList.add('invisible');
    return this;
  }

  isVisible() {
    return !this.container.classList.contains('invisible');
  }

  enableMathMode(enable: boolean): this {
    if (enable) {
      this.mathMode = true;
      this.getMathModeElements().show.forEach((e) =>
        e.classList.remove('invisible')
      );
      this.getMathModeElements().hide.forEach((e) =>
        e.classList.add('invisible')
      );
    } else {
      this.mathMode = false;
      this.getMathModeElements().show.forEach((e) =>
        e.classList.add('invisible')
      );
      this.getMathModeElements().hide.forEach((e) =>
        e.classList.remove('invisible')
      );
    }
    return this;
  }

  toggleMathMode(): this {
    return this.enableMathMode(!this.mathMode);
  }

  isMathModeEnabled() {
    return this.mathMode;
  }
}

export { BaseScenario };
