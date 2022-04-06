import assert from 'assert';
import { EventEmitter } from 'events';
import {
  BoxModelForScenario,
  BoxModelEngine,
  Record,
  ConvergenceCriterion,
} from './box-model-definition';

export type SimulationResult = { timestamp: number; record: Record };

export class Simulation extends EventEmitter {
  protected model: BoxModelForScenario;

  protected engine: BoxModelEngine;

  protected lastResult: SimulationResult | null = null;

  protected lastSimStopTimestamp = -1;

  protected simulationTime = 0;

  protected simulationTimeOffset = -1;

  private simulationFrameId = 0;

  protected convergenceCriterionForInitialRecord: ConvergenceCriterion | null =
    null;

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

  initialConvergedRecord(criterion: ConvergenceCriterion): Record {
    return this.convergeRecord(this.initialRecord(), criterion);
  }

  convergeInitialRecord(criterion: ConvergenceCriterion) {
    this.convergenceCriterionForInitialRecord = criterion;
  }

  bootstrap() {
    if (this.lastResult === null) {
      this.lastResult = {
        timestamp: 0,
        record:
          this.convergenceCriterionForInitialRecord === null
            ? this.initialRecord()
            : this.initialConvergedRecord(
                this.convergenceCriterionForInitialRecord
              ),
      };
      this.emit('results', [this.lastResult]);
    }
  }

  setParameter(value: number, allowOutOfRange = false): void {
    const { model } = this;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { min, max } = p;
      const valueClamped = allowOutOfRange
        ? value
        : Math.min(max, Math.max(min, value));
      if (p.value !== valueClamped) {
        p.value = valueClamped;
        (this as EventEmitter).emit(
          'parameter-changed',
          model.parameters[0],
          value
        );
      }
    }
  }

  setParameterRelative(value: number, allowOutOfRange = false): void {
    const { min, max } = this.getParameterRange();
    this.setParameter(min + value * (max - min), allowOutOfRange);
  }

  getParameterId() {
    const { model } = this;
    if (typeof model.parameters[0] !== 'undefined') {
      const { id } = model.parameters[0];
      return id;
    }
    return '';
  }

  getParameter(allowOutOfRange = false): number {
    const { model } = this;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { value, min, max } = p;
      const valueClamped = allowOutOfRange
        ? value
        : Math.min(max, Math.max(min, value));
      return valueClamped;
    }
    return 0;
  }

  getParameterRange(): { min: number; max: number } {
    const { model } = this;
    if (typeof model.parameters[0] !== 'undefined') {
      const p = model.parameters[0];
      const { min, max } = p;
      return { min, max };
    }
    return { min: 0, max: 1 };
  }

  getParameterRelative(allowOutOfRange = true): number {
    const { min, max } = this.getParameterRange();
    const value = this.getParameter(allowOutOfRange);
    return (value - min) / (max - min);
  }

  getModel(): BoxModelForScenario {
    return this.model;
  }

  getEngine(): BoxModelEngine {
    return this.engine;
  }

  reset() {
    const shouldPlay = this.isPlaying();
    if (shouldPlay) {
      this.simulate(false);
    }

    const { model } = this;
    model.parameters.forEach((p, i) => {
      if (i === 0) {
        this.setParameter(p.initialValue);
      } else {
        // eslint-disable-next-line no-param-reassign
        p.value = p.initialValue;
      }
    });

    this.lastSimStopTimestamp = -1;
    this.simulationTime = 0;
    this.simulationTimeOffset = -1;

    this.lastResult = null;

    this.emit('reset');

    if (shouldPlay) {
      this.simulate(true);
    }
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

    this.bootstrap();
    assert(this.lastResult !== null);

    const timeStep = 1000 / model.stepsPerSecond;
    let { timestamp, record } = this.lastResult;
    const h = stepSize / (subSteps + 1);
    while (timestamp + timeStep <= targetSimulationTime) {
      for (let i = 0; i < subSteps + 1; i += 1) {
        const { t, stocks, flows } = record;
        record = this.engine.stepExt(stocks, flows, t, h);
      }
      timestamp += timeStep;
      this.lastResult = { timestamp, record };
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
        const cb = (timestamp: number) => {
          const targetSimulationTime = timestamp - this.simulationTimeOffset;
          this.stepSimulation(targetSimulationTime);
          this.simulationFrameId = requestAnimationFrame(cb);
        };
        cb(now);
      }
    } else if (this.simulationFrameId !== 0) {
      cancelAnimationFrame(this.simulationFrameId);
      this.simulationFrameId = 0;
      this.lastSimStopTimestamp = now;
    }
  }

  public convergeRecord(
    record: Record,
    criterion: ConvergenceCriterion
  ): Record {
    const { model } = this;
    const { stepSize } = model;
    let { subSteps } = model;
    subSteps = Math.max(0, subSteps);
    const h = stepSize / (subSteps + 1);

    return this.engine.convergeExt(record.stocks, record.t, h, criterion);
  }

  public converge(criterion: ConvergenceCriterion): SimulationResult {
    this.bootstrap();
    assert(this.lastResult !== null);

    const { timestamp, record: lastRecord } = this.lastResult;
    const record: Record = this.convergeRecord(lastRecord, criterion);
    this.lastResult = { timestamp, record };
    return this.lastResult;
  }
}
