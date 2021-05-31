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

  protected lastSimStopTimestamp: number = -1;
  protected simulationTime: number = 0;
  protected simulationTimeOffset: number = -1;
  private simulationFrameId: number = 0;

  constructor(view: ScenarioView) {
    this.view = view;
    this.engine = new BoxModelEngine(this.view.simulation.model);
  }

  setParameter(value: number) {
    const { model } = this.view.simulation;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { min, max } = p;
      const valueClamped = Math.min(max, Math.max(min, value));
      p.value = valueClamped;
    }
  }

  getParameter() {
    const { model } = this.view.simulation;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { value, min, max } = p;
      const valueClamped = Math.min(max, Math.max(min, value));
      return valueClamped;
    } else {
      return 0;
    }
  }

  getParameterRange() {
    const { model } = this.view.simulation;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { min, max } = p;
      return { min, max };
    } else {
      return { min: 0, max: 1 };
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
    this.simulate(true);
    this.view.animate(true);
  }

  pause() {
    this.simulate(false);
    this.view.animate(false);
  }

  async stop() {
    await this.view.tweenOut();
    this.pause();
  }

  isPlaying() {
    return this.simulationFrameId !== 0 && this.view.isAnimating();
  }

  protected stepSimulation(targetSimulationTime: number): void {
    const { model, results } = this.view.simulation;
    const { stepSize, numSteps } = model;
    let { subSteps } = model;
    subSteps = Math.max(0, subSteps);
    if (results.length === 0) {
      const stocks = model.stocks.map(({ initialValue }) => initialValue);
      const record = this.engine.evaluateGraph(stocks, 0);
      const result: SimulationResult = [0, record];
      results.push(result);
    }
    const timeStep = 1000 / model.stepsPerSecond;
    let [timestamp, record] = results[results.length - 1];
    const h = stepSize / (subSteps + 1);
    while (timestamp + timeStep <= targetSimulationTime) {
      for (let i = 0; i < subSteps + 1; i += 1) {
        const { t, stocks, flows } = record;
        record = this.engine.stepExt(stocks, flows, t, h);
      }
      timestamp += timeStep;
      const result: SimulationResult = [timestamp, record];
      results.push(result);
      while (results.length > numSteps) results.shift();
    }
  }

  protected simulate(on: boolean): void {
    const now = performance.now();
    if (on) {
      if (this.simulationFrameId === 0) {
        if (this.lastSimStopTimestamp === -1) {
          this.simulationTimeOffset = now;
        } else {
          this.simulationTimeOffset += now - this.lastSimStopTimestamp;
        }
        const cb = (now) => {
          const targetSimulationTime = now - this.simulationTimeOffset;
          this.stepSimulation(targetSimulationTime);
          this.simulationFrameId = requestAnimationFrame(cb);
        };
        cb(now);
      }
    } else {
      if (this.simulationFrameId !== 0) {
        cancelAnimationFrame(this.simulationFrameId);
        this.simulationFrameId = 0;
        this.lastSimStopTimestamp = now;
      }
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
      if (this.animationFrameRequestId === 0) {
        const cb = () => {
          this.update();
          this.animationFrameRequestId = requestAnimationFrame(cb);
        };
        cb();
      }
    } else {
      cancelAnimationFrame(this.animationFrameRequestId);
      this.animationFrameRequestId = 0;
    }
  }

  isAnimating() {
    return this.animationFrameRequestId !== 0;
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
