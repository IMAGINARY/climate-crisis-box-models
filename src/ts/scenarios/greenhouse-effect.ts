/* eslint max-classes-per-file: ["error", { ignoreExpressions: true }] */

import assert from 'assert';
import cloneDeep from 'lodash/cloneDeep';
import { ConvergenceCriterion } from '@imaginary-maths/box-model';
import { SVG, Runner, Timeline } from '@svgdotjs/svg.js';
import { easingEffects } from 'chart.js/helpers';

import { BaseScenario } from './base';
import createModel, {
  epsilonFactor,
  epsilonOffset,
} from '../models/greenhouse-effect';
import { Simulation, SimulationResult } from '../simulation';
import {
  createSvgMorphUpdater,
  createExtractor,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  formatCelsiusFrac,
  formatPpm,
  loadSvg,
  secondsToYears,
  kelvinToCelsius,
  Updater,
  createFuncUpdater,
  extendRangeRel,
  reserveTimeSlot,
} from '../util';
import { createGraphCanvas } from '../charts/common';

import { Record, convertToBoxModelForScenario } from '../box-model-definition';
import { TimeVsYChart, TimeVsYChartOptions } from '../charts/time-vs-y';
import {
  temperaturesCelsius,
  co2EqCMIP6ssp245,
  co2EqCMIP6ssp585,
} from '../data';
import { preprocessSvg } from '../svg-utils';

const scenarioSvgUrl: URL = new URL(
  './../../svg/greenhouse-effect.svg',
  import.meta.url
);

export type Resources = {
  svg: XMLDocument;
  co2Datasets: { x: number; y: number }[][];
  temperatureDatasets: { x: number; y: number }[][];
};

const model = createModel();

const modelForScenario = convertToBoxModelForScenario(model);
const yearExtractor = createYearExtractor(model);

const gndTemperatureIdx = model.variables
  .map(({ id }) => id)
  .indexOf('gnd temperature');

const createRawChartOptions = (
  x: number,
  yMin: number,
  yMax: number
): TimeVsYChartOptions['rawChartOptions'] => ({
  plugins: {
    annotation: {
      annotations: {
        line1: {
          type: 'line',
          xMin: x,
          xMax: x,
          yMin,
          yMax,
          borderColor: 'rgba(0, 0, 0, 25%)',
          borderWidth: 2,
          drawTime: 'beforeDraw',
        },
        label1: {
          type: 'label',
          xValue: x,
          yValue: yMax,
          yAdjust: -7,
          padding: 3,
          content: 'Gegenwart',
          color: 'rgba(0, 0, 0, 40%)',
          font: { family: 'RobotoCondensed-Regular', size: 11 },
          drawTime: 'beforeDraw',
        },
      },
    },
  },
});

export default class GreenhouseEffectScenario extends BaseScenario {
  protected readonly svg;

  protected readonly charts: TimeVsYChart[];

  protected readonly vizUpdaters: Updater[];

  protected readonly resetIfIndicatedHandler: (
    r: ReadonlyArray<SimulationResult>
  ) => void;

  protected rewindPromise: Promise<void> | null = null;

  protected readonly history: SimulationResult[] = [];

  // protected modelSceneConnections: ((record: Record) => void)[];

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(elem, new Simulation(cloneDeep(modelForScenario)));

    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.getScene().appendChild(this.svg.node);
    this.enableMathMode(this.isMathModeEnabled());

    //    this.modelSceneConnections = this.prepareModelToSceneConnections();

    const { min: tempMin, max: tempMax } = extendRangeRel(
      model.variables[gndTemperatureIdx],
      0.2
    );

    const tempMinCelsius = kelvinToCelsius(tempMin);
    const tempMaxCelsius = kelvinToCelsius(tempMax);

    const tempCanvas: HTMLCanvasElement = createGraphCanvas();
    this.getScene().appendChild(tempCanvas);

    const tempChartOptions: TimeVsYChartOptions = {
      numYears: model.numSteps,
      minY: tempMinCelsius,
      maxY: tempMaxCelsius,
      yAxisLabel: () => 'Temperatur [T]=°C',
      yDataFormatter: ({ y }) => formatCelsiusFrac(y),
      timeAxisTitle: () => 'Zeit [t]=Jahrhundert',
      timeTickStepSize: 100,
      toYear: yearExtractor,
      toYUnit: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'gnd temperature'
      ),
      bgData: resources.temperatureDatasets,
      rawChartOptions: createRawChartOptions(
        temperaturesCelsius.length,
        tempMinCelsius,
        tempMaxCelsius - (tempMaxCelsius - tempMinCelsius) / 6
      ),
    };

    const tempChart = new TimeVsYChart(tempCanvas, tempChartOptions);

    const { min: co2Min, max: co2Max } = extendRangeRel(
      model.parameters.filter((p) => p.id === 'co2')[0],
      0.2
    );

    const co2Canvas: HTMLCanvasElement = createGraphCanvas();
    this.getScene().appendChild(co2Canvas);

    const co2ChartOptions: TimeVsYChartOptions = {
      numYears: model.numSteps,
      minY: co2Min,
      maxY: co2Max,
      yAxisLabel: () => 'CO₂ [C]=ppm',
      yDataFormatter: ({ y }) => formatPpm(y),
      timeAxisTitle: () => 'Zeit [t]=Jahrhundert',
      timeTickStepSize: 100,
      toYear: yearExtractor,
      toYUnit: createExtractor(model, 'parameters', 'co2'),
      bgData: resources.co2Datasets,
      rawChartOptions: createRawChartOptions(
        temperaturesCelsius.length,
        co2Min,
        co2Max - (co2Max - co2Min) / 6
      ),
    };

    const co2Chart = new TimeVsYChart(co2Canvas, co2ChartOptions);

    this.charts = [tempChart, co2Chart];

    this.vizUpdaters = this.createVizUpdaters();

    const { history } = this;
    const historyUpdater = createFuncUpdater({
      reset: () => {
        history.length = 0;
      },
      update: (r: ReadonlyArray<SimulationResult>) => {
        history.push(...r);
      },
    });

    this.updaters.push(...this.charts, ...this.vizUpdaters, historyUpdater);

    this.enableMathMode(false);

    this.resetIfIndicatedHandler = this.resetIfIndicated.bind(this);
    this.getSimulation().on('results', this.resetIfIndicatedHandler);
  }

  /*
  prepareModelToSceneConnections(): ((record: Record) => void)[] {
    const formatter = new Intl.NumberFormat('de', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const format = formatter.format.bind(formatter);

    const connectModelElemType = (
      modelElemType: BoxModelElementKey
    ): ((record: Record) => void)[][] =>
      model[modelElemType].map(({ id }: { id: string }, idx: number) => {
        const cssDataId = CSS.escape(id);
        const elems: NodeListOf<HTMLElement> =
          this.overlaySvg.node.querySelectorAll(`*[data-id="${cssDataId}"]`);
        const extractValue = (record: Record): number => {
          const recordElement = record[modelElemType];
          return recordElement[idx];
        };
        return Array.from(elems).map(
          (elem: HTMLElement) =>
            function setInnerText(record: Record) {
              // eslint-disable-next-line no-param-reassign
              elem.innerText = `${format(extractValue(record))}`;
            }
        );
      });
    const supportedTypes: BoxModelElementKey[] = [
      'stocks',
      'flows',
      'parameters',
      'variables',
    ];
    const nestedModelSceneConnections =
      supportedTypes.map(connectModelElemType);
    return flatten(flatten(nestedModelSceneConnections));
  }
*/

  static async fixScenarioSvg(svg: XMLDocument): Promise<void> {
    // general fix-ups
    const parentClassName = 'greenhouse-effect-scenario';
    await preprocessSvg(svg, parentClassName);

    const epsilonFormulaTag = svg.querySelector('text[id=mathmode03-epsilon]');
    assert(epsilonFormulaTag, 'tag of epsilon formula not found');
    const f = new Intl.NumberFormat('de', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
    epsilonFormulaTag.textContent = `є = ${f.format(
      epsilonFactor
    )} ln(C) + ${f.format(epsilonOffset)}`;
  }

  static async loadResources(): Promise<Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    await GreenhouseEffectScenario.fixScenarioSvg(svg);

    const temperatureDatasets = [
      temperaturesCelsius.map((value, index) => ({
        x: index,
        y: value,
      })),
      await GreenhouseEffectScenario.computeTemperatureData(co2EqCMIP6ssp245),
      await GreenhouseEffectScenario.computeTemperatureData(co2EqCMIP6ssp585),
    ];

    const co2Datasets = [
      co2EqCMIP6ssp245.map((value, index) => ({
        x: index,
        y: value,
      })),
      co2EqCMIP6ssp585.map((value, index) => ({
        x: index,
        y: value,
      })),
    ];

    return { svg, temperatureDatasets, co2Datasets };
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Greenhouse Effect';
  }

  protected async resetIfIndicatedAsync(
    results: ReadonlyArray<SimulationResult>
  ) {
    if (results.length > 0) {
      const lastResult = results[results.length - 1];
      if (yearExtractor(lastResult) >= model.numSteps) {
        this.getSimulation().off('results', this.resetIfIndicatedHandler);
        {
          const updaters = [...this.updaters];
          this.updaters.splice(0, this.updaters.length);
          await this.rewind();
          this.getSimulation().reset();
          this.updaters.push(...updaters);
        }
        this.getSimulation().on('results', this.resetIfIndicatedHandler);
      }
    }
  }

  protected resetIfIndicated(results: ReadonlyArray<SimulationResult>) {
    this.resetIfIndicatedAsync(results).then(
      () => {},
      () => {}
    );
  }

  async rewind(
    duration = 6000,
    easingFunction: (amount: number) => number = easingEffects.easeInOutExpo
  ) {
    if (this.rewindPromise !== null) {
      await this.rewindPromise;
      return;
    }

    const dataWithLength = [
      ...this.charts.map((chart) => ({
        data: chart.data(),
        length: chart.data().length,
      })),
      { data: this.history, length: this.history.length },
    ];

    this.rewindPromise = new Promise<void>((resolve) => {
      const runner = new Runner(duration)
        .during((t: number) => {
          const easedT = easingFunction(t);
          dataWithLength.forEach(({ data, length }) => {
            // eslint-disable-next-line no-param-reassign
            data.length = Math.min(
              Math.floor(1 + (length - 1) * (1 - easedT)),
              length - 1
            );
          });
          this.charts.forEach((chart) => chart.update([]));
          if (this.history.length > 0) {
            const lastResult = this.history[this.history.length - 1];
            this.vizUpdaters.forEach((updater) => {
              updater.update([lastResult]);
            });
          }
        })
        .after(() => {
          this.rewindPromise = null;
          resolve();
        });

      const timeline = new Timeline();
      timeline.schedule(runner);
      timeline.play();
    });

    await this.rewindPromise;
  }

  protected createVizUpdaters() {
    const solarEmissivityVizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'solar emissivity',
      this.svg,
      '[id^=sun]',
      '[id^=sun-min]',
      '[id^=sun-max]',
      'sun-in-between'
    );

    const sunRadiationVizUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'sun radiation',
      this.svg,
      '[id^=arrowL]',
      '[id^=arrowL-min]',
      '[id^=arrowL-max]',
      'arrowL-in-between'
    );

    const albedoVizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'albedo',
      this.svg,
      '[id^=ice]',
      '[id^=ice-min]',
      '[id^=ice-max]',
      'ice-in-between'
    );

    const reflectedSunRadiationVizUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'reflected sun radiation',
      this.svg,
      '[id^=arrowA]',
      '[id^=arrowA-min]',
      '[id^=arrowA-max]',
      'arrowA-in-between'
    );

    const co2VizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'co2',
      this.svg,
      '[id^=co2]',
      '[id^=co2-min]',
      '[id^=co2-max]',
      'co2-in-between'
    );

    const atmInfraredRadiationToSpaceUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'atm infrared radiation',
      this.svg,
      '[id^=arrowT03]',
      '[id^=arrowT03-min]',
      '[id^=arrowT03-max]',
      'arrowAtmIrToSpace-in-between'
    );

    const atmInfraredRadiationToGroundUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'atm infrared radiation',
      this.svg,
      '[id^=arrowT02]',
      '[id^=arrowT02-min]',
      '[id^=arrowT02-max]',
      'arrowAtmIrToGround-in-between'
    );

    const gndInfraredRadiationUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'gnd infrared radiation',
      this.svg,
      '[id^=arrowT01]',
      '[id^=arrowT01-min]',
      '[id^=arrowT01-max]',
      'arrowGndIr-in-between'
    );

    const gndInfraredRadiationNotAbsorbedUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'gnd infrared radiation not absorbed',
      this.svg,
      '[id^=arrowT04]',
      '[id^=arrowT04-min]',
      '[id^=arrowT04-max]',
      'arrowGndIrNotAbsorbed-in-between'
    );

    return [
      solarEmissivityVizUpdater,
      sunRadiationVizUpdater,
      albedoVizUpdater,
      reflectedSunRadiationVizUpdater,
      co2VizUpdater,
      atmInfraredRadiationToSpaceUpdater,
      atmInfraredRadiationToGroundUpdater,
      gndInfraredRadiationUpdater,
      gndInfraredRadiationNotAbsorbedUpdater,
    ];
  }

  protected static getConvergenceCriterion(eps = 0.001): ConvergenceCriterion {
    const convergenceCriterion = (record: Record, lastRecord: Record) => {
      const temp = record.variables[gndTemperatureIdx];
      const lastTemp = lastRecord.variables[gndTemperatureIdx];
      return Math.abs(temp - lastTemp) < eps;
    };

    return convergenceCriterion;
  }

  protected static async computeTemperatureData(
    co2: ReadonlyArray<number>
  ): Promise<{ x: number; y: number }[]> {
    const simulation = new Simulation(cloneDeep(modelForScenario));
    if (co2.length > 0) {
      const getCO2 = (year: number): number => {
        const lowYear = Math.floor(year);
        const fracYear = year - lowYear;
        if (lowYear < co2.length - 1) {
          const low = co2[lowYear];
          const high = co2[lowYear + 1];
          return low + fracYear * (high - low);
        }
        return co2[co2.length - 1];
      };

      const recordToData = (record: Record): { x: number; y: number } => ({
        x: secondsToYears(record.t),
        y: kelvinToCelsius(record.variables[gndTemperatureIdx]),
      });

      simulation.setParameter(co2[0], true);
      simulation.convergeInitialModelRecord(
        GreenhouseEffectScenario.getConvergenceCriterion(),
        { postProcess: (r: Record) => ({ ...r, t: 0 }) }
      );

      const engine = simulation.getEngine();
      const { stepSize } = simulation.getModel();
      let { subSteps } = simulation.getModel();
      subSteps = Math.max(0, subSteps);
      let record = simulation.getInitialRecord();
      const temperatures = [recordToData(record)];
      const h = stepSize / (subSteps + 1);
      while (secondsToYears(record.t) <= co2.length) {
        // eslint-disable-next-line no-await-in-loop
        const idleDeadline = await reserveTimeSlot();
        while (secondsToYears(record.t) <= co2.length) {
          simulation.setParameter(getCO2(secondsToYears(record.t)), true);
          for (let i = 0; i < subSteps + 1; i += 1) {
            const { t, stocks, flows } = record;
            record = engine.stepExt(stocks, flows, t, h);
          }
          const temperatureData = recordToData(record);
          temperatures.push(temperatureData);
          if (idleDeadline.timeRemaining() === 0) break;
        }
      }
      return temperatures;
    }
    return [];
  }

  /*
  protected update(newResults: SimulationResult[]) {
    this.chart.update(newResults);
    //    this.updateOverlay(newResults);
    this.updateCO2();
  }

  protected updateOverlay(newResults: SimulationResult[]) {
    if (newResults.length > 0) {
      const lastNewResult: SimulationResult = newResults[newResults.length - 1];
      const { record: lastRecord } = lastNewResult;
      this.modelSceneConnections.forEach((c) => c(lastRecord));
    }
  }

  protected updateCO2() {
    const simulation = this.getSimulation();
    const { min, max } = simulation.getParameterRange();
    const value = simulation.getParameter();
    const relValue = (value - min) / (max - min);
    const scale = 0.5 + (3 + 0.5) * relValue;

    const co2 = this.svg.findOne('#co2') as SVGElement;
    co2.transform({ scale });
  }
*/

  getMathModeElements() {
    const nonMathModeText = this.svg.findOne('[id^=text03]');
    assert(nonMathModeText !== null);

    const mathModeOverlay = this.svg.findOne('[id^=mathmode-model03]');
    assert(mathModeOverlay !== null);

    return {
      hide: [nonMathModeText.node],
      show: [mathModeOverlay.node],
    };
  }
}

export { GreenhouseEffectScenario };
