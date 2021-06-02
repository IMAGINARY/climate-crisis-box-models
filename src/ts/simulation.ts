import { EventEmitter } from 'events';
import { BoxModelEngine, Record } from './box-model';
import { BoxModelForScenario } from './box-model-definition';

export type SimulationResult = [number, Record];

export class Simulation extends EventEmitter {
  protected model: BoxModelForScenario;
  protected engine: BoxModelEngine;
  protected lastResult: SimulationResult = null;

  protected lastSimStopTimestamp: number = -1;
  protected simulationTime: number = 0;
  protected simulationTimeOffset: number = -1;
  private simulationFrameId: number = 0;

  constructor(model: BoxModelForScenario) {
    super();
    this.model = model;
    this.engine = new BoxModelEngine(model);
  }

  initialRecord(): Record {
    const stocks = this.model.stocks.map(({ initialValue }) => initialValue);
    const record = this.engine.evaluateGraph(stocks, 0);
    return record;
  }

  setParameter(value: number) {
    const { model } = this;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { min, max } = p;
      const valueClamped = Math.min(max, Math.max(min, value));
      if (p.value !== valueClamped) {
        p.value = valueClamped;
        this.emit('parameter-changed', model.parameters[0]);
      }
    }
  }

  getParameterId() {
    const { model } = this;
    if (typeof model.parameters[0] !== 'undefined') {
      const { id } = model.parameters[0];
      return id;
    } else {
      return '';
    }
  }

  getParameter() {
    const { model } = this;
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
    const { model } = this;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { min, max } = p;
      return { min, max };
    } else {
      return { min: 0, max: 1 };
    }
  }

  reset() {
    const { model } = this;
    model.parameters.forEach((p) => (p.value = p.initialValue));
    this.lastResult = null;
    this.emit('reset');
  }

  start() {
    this.reset();
    this.play();
  }

  play() {
    this.emit('play');
    this.simulate(true);
  }

  pause() {
    this.simulate(false);
    this.emit('pause');
  }

  stop() {
    this.pause();
  }

  isPlaying() {
    return this.simulationFrameId !== 0;
  }

  protected stepSimulation(targetSimulationTime: number): SimulationResult[] {
    const results: SimulationResult[] = [];
    const { model } = this;
    const { stepSize } = model;
    let { subSteps } = model;
    subSteps = Math.max(0, subSteps);
    if (this.lastResult === null) {
      this.lastResult = [0, this.initialRecord()];
      results.push(this.lastResult);
    }

    const timeStep = 1000 / model.stepsPerSecond;
    let [timestamp, record] = this.lastResult;
    const h = stepSize / (subSteps + 1);
    while (timestamp + timeStep <= targetSimulationTime) {
      for (let i = 0; i < subSteps + 1; i += 1) {
        const { t, stocks, flows } = record;
        record = this.engine.stepExt(stocks, flows, t, h);
      }
      timestamp += timeStep;
      this.lastResult = [timestamp, record];
      results.push(this.lastResult);
    }

    if (results.length > 0) {
      this.emit('results', results);
    }

    return results;
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
