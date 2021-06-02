import TWEEN from '@tweenjs/tween.js';

import { Scenario } from '../scenario';
import { Simulation, SimulationResult } from '../simulation';
import { BoxModelEngine } from '../box-model';

export abstract class BaseScenario implements Scenario {
  public readonly simulation: Simulation;
  protected parent: HTMLDivElement;
  protected container: HTMLDivElement;
  private animationFrameRequestId: number = 0;
  private tweenPromise: Promise<void> = Promise.resolve();

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

  tweenIn() {
    const promise = new Promise<void>((resolve) => {
      this.container.addEventListener('transitionend', () => resolve());
    });
    this.container.classList.remove('fade-out');
    this.container.classList.add('fade-in');
    return promise;
  }

  tweenOut() {
    const promise = new Promise<void>((resolve) => {
      this.container.addEventListener('transitionend', () => resolve());
    });
    this.container.classList.remove('fade-in');
    this.container.classList.add('fade-out');
    return promise;
  }
}
