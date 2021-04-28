import TWEEN from '@tweenjs/tween.js';

import {
  ScenarioController,
  ScenarioView,
  Simulation,
  SimulationResult,
} from '../scenario';
import { BoxModelEngine } from '../box-model';

export class BaseScenarioController implements ScenarioController {
  protected view: ScenarioView;
  protected engine: BoxModelEngine;

  private simulationIntervalId: NodeJS.Timeout | 0 = 0;

  constructor(view: ScenarioView) {
    this.view = view;
    this.engine = new BoxModelEngine(this.view.simulation.model);
  }

  setParameter(t: number) {
    const { model } = this.view.simulation;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const tClamped = Math.min(1, Math.max(0, t));
      p.value = p.min + tClamped * (p.max - p.min);
    }
  }

  reset() {
    const { model } = this.view.simulation;
    model.parameters.forEach((p) => (p.value = p.initialValue));
  }

  async start() {
    this.reset();
    this.play();
    await this.view.tweenIn();
  }

  play() {
    this.view.animate(true);
  }

  pause() {
    this.view.animate(false);
  }

  async stop() {
    await this.view.tweenOut();
    this.pause();
  }

  protected stepSimulation(): void {
    const { model, results } = this.view.simulation;
    const { stepSize, numSteps } = model;
    let timestamp = performance.now();
    if (results.length === 0) {
      const stocks = model.stocks.map(({ initialValue }) => initialValue);
      const record = this.engine.evaluateGraph(stocks, 0);
      const result: SimulationResult = [timestamp, record];
      results.push(result);
    } else {
      const timeStep = 1000 / model.stepsPerSecond;
      let [lastTimestamp, lastRecord] = results[results.length - 1];
      while (lastTimestamp + timeStep <= timestamp) {
        const { t, stocks, flows } = lastRecord;
        const newRecord = this.engine.stepExt(stocks, flows, t, stepSize);
        const newTimestamp = lastTimestamp + timeStep;
        const result: SimulationResult = [newTimestamp, newRecord];
        results.push(result);
        while (results.length > numSteps) results.shift();
        lastTimestamp = newTimestamp;
        lastRecord = newRecord;
      }
    }
  }

  protected simulate(on: boolean): void {
    if (on) {
      if (this.simulationIntervalId !== 0) {
        const { model } = this.view.simulation;
        this.stepSimulation();
        const timeStep = 1000 / model.stepsPerSecond;
        this.simulationIntervalId = setInterval(
          this.stepSimulation.bind(this),
          timeStep
        );
      }
    } else {
      if (this.simulationIntervalId !== 0) {
        clearInterval(this.simulationIntervalId);
      }
      this.simulationIntervalId = 0;
    }
  }
}

export abstract class BaseScenarioView implements ScenarioView {
  public readonly simulation: Simulation;
  protected container: HTMLDivElement;
  private animationFrameRequestId: number = 0;
  private tweenPromise: Promise<void> = Promise.resolve();

  protected constructor(elem: HTMLDivElement, simulation: Simulation) {
    this.container = elem;
    this.simulation = simulation;
  }

  abstract update();

  animate(on) {
    if (on) {
      if (this.animationFrameRequestId !== 0) {
        this.update();
        this.animationFrameRequestId = requestAnimationFrame(
          this.update.bind(this)
        );
      }
    } else {
      cancelAnimationFrame(this.animationFrameRequestId);
      this.animationFrameRequestId = 0;
    }
  }

  protected async tweenOpacity(targetOpacity: number): Promise<void> {
    await this.tweenPromise;
    this.tweenPromise = new Promise<void>((resolve) => {
      let done = false;
      const tween = new TWEEN.Tween(this.container.style)
        .to({ opacity: targetOpacity }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          done = true;
          resolve();
        })
        .start();
      const animate = (timeMs) => {
        if (!done) {
          tween.update(timeMs);
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    });
    return this.tweenPromise;
  }

  tweenIn() {
    return this.tweenOpacity(1.0);
  }

  tweenOut() {
    return this.tweenOpacity(0.0);
  }
}
