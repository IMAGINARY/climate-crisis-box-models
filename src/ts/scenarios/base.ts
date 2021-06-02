import { Scenario } from '../scenario';
import { Simulation, SimulationResult } from '../simulation';

export abstract class BaseScenario implements Scenario {
  public readonly simulation: Simulation;
  protected parent: HTMLDivElement;
  protected container: HTMLDivElement;

  protected constructor(elem: HTMLDivElement, simulation: Simulation) {
    this.parent = elem;
    this.container = document.createElement('div');
    this.container.classList.add('scenario');
    this.parent.appendChild(this.container);
    this.simulation = simulation;
    this.simulation.on('results', (results) => this.update(results));
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
}
