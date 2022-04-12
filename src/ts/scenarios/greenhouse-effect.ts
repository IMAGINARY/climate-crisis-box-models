import assert from 'assert';
import { ConvergenceCriterion } from '@imaginary-maths/box-model';
import { SVG } from '@svgdotjs/svg.js';

import { BaseScenario } from './base';
import model from '../models/greenhouse-effect';
import { Simulation, SimulationResult } from '../simulation';
import {
  createSvgMorphUpdater,
  createExtractor,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  formatCelsiusFrac,
  formatPpmFrac,
  loadSvg,
} from '../util';

import { Record, convertToBoxModelForScenario } from '../box-model-definition';
import { TimeVsYChart, TimeVsYChartOptions } from '../charts/x-vs-time';
import {
  firstYear,
  temperaturesCelsius,
  co2CMIP6ssp245,
  co2CMIP6ssp585,
} from '../data';
import { preprocessSvg } from '../svg-utils';

const scenarioSvgUrl: URL = new URL(
  './../../svg/greenhouse-effect.svg',
  import.meta.url
);

export type Resources = {
  svg: XMLDocument;
};

const modelForScenario = convertToBoxModelForScenario(model);
const yearExtractor = createYearExtractor(model);

export default class GreenhouseEffectScenario extends BaseScenario {
  protected readonly svg;

  // protected modelSceneConnections: ((record: Record) => void)[];

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(
      elem,
      new Simulation(modelForScenario).convergeInitialModelRecord(
        GreenhouseEffectScenario.getConvergenceCriterion(0.001),
        { postProcess: (r: Record) => ({ ...r, t: 0 }) }
      )
    );

    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.getScene().appendChild(this.svg.node);
    this.enableMathMode(this.isMathModeEnabled());

    //    this.modelSceneConnections = this.prepareModelToSceneConnections();

    const { min: tempMin, max: tempMax } = model.variables.filter(
      (v) => v.id === 'gnd temperature'
    )[0];

    const tempCanvas: HTMLCanvasElement = document.createElement('canvas');
    tempCanvas.width = 238;
    tempCanvas.height = 176;
    tempCanvas.classList.add('graph1');
    this.getScene().appendChild(tempCanvas);

    const tempChartOptions: TimeVsYChartOptions = {
      numYears: model.numSteps,
      minY: tempMin,
      maxY: tempMax,
      yAxisLabel: () => 'Temperature (°C)',
      yDataFormatter: ({ y }) => formatCelsiusFrac(y),
      timeAxisTitle: () => 'Zeit (Jahrhundert)',
      timeTickStepSize: 100,
      toYear: yearExtractor,
      toYUnit: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'gnd temperature'
      ),
      bgData: [
        temperaturesCelsius.map(({ year, value }) => ({
          x: year - firstYear,
          y: value,
        })),
      ],
    };

    const tempChart = new TimeVsYChart(tempCanvas, tempChartOptions);

    const { min: co2Min, max: co2Max } = model.parameters.filter(
      (p) => p.id === 'co2'
    )[0];

    const co2Canvas: HTMLCanvasElement = document.createElement('canvas');
    co2Canvas.width = 238;
    co2Canvas.height = 176;
    co2Canvas.classList.add('graph2');
    this.getScene().appendChild(co2Canvas);

    const co2ChartOptions: TimeVsYChartOptions = {
      numYears: model.numSteps,
      minY: co2Min,
      maxY: co2Max,
      yAxisLabel: () => 'CO₂ (ppm)',
      yDataFormatter: ({ y }) => formatPpmFrac(y),
      timeAxisTitle: () => 'Zeit (Jahrhundert)',
      timeTickStepSize: 100,
      toYear: yearExtractor,
      toYUnit: createExtractor(model, 'parameters', 'co2'),
      bgData: [
        co2CMIP6ssp245.map(({ year, ppm }) => ({
          x: year - firstYear,
          y: ppm,
        })),
        co2CMIP6ssp585.map(({ year, ppm }) => ({
          x: year - firstYear,
          y: ppm,
        })),
      ],
    };

    const co2Chart = new TimeVsYChart(co2Canvas, co2ChartOptions);

    this.updaters.push(tempChart, co2Chart, ...this.createVizUpdaters());

    this.getSimulation().on('results', this.resetIfIndicated.bind(this));
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

  static fixScenarioSvg(svg: XMLDocument): void {
    // general fix-ups
    const parentClassName = 'greenhouse-effect-scenario';
    preprocessSvg(svg, parentClassName);
  }

  static async loadResources(): Promise<Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    GreenhouseEffectScenario.fixScenarioSvg(svg);
    return { svg };
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Greenhouse Effect';
  }

  protected resetIfIndicated(results: ReadonlyArray<SimulationResult>): void {
    if (results.length > 0) {
      const lastResult = results[results.length - 1];
      if (yearExtractor(lastResult) > model.numSteps) this.reset();
    }
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
    const temperatureIdx = model.variables
      .map(({ id }) => id)
      .indexOf('gnd temperature');

    const convergenceCriterion = (record: Record, lastRecord: Record) => {
      const temp = record.variables[temperatureIdx];
      const lastTemp = lastRecord.variables[temperatureIdx];
      return Math.abs(temp - lastTemp) < eps;
    };

    return convergenceCriterion;
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
    const nonMathModeText = this.svg.findOne('[id^=text02]');
    assert(nonMathModeText !== null);

    const mathModeOverlay = this.svg.findOne('[id^=mathmode03]');
    assert(mathModeOverlay !== null);

    return {
      hide: [nonMathModeText.node],
      show: [mathModeOverlay.node],
    };
  }
}

export { GreenhouseEffectScenario };
