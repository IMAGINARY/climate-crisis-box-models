import assert from 'assert';
import cloneDeep from 'lodash/cloneDeep';
import { SVG } from '@svgdotjs/svg.js';
import { ConvergenceCriterion } from '@imaginary-maths/box-model';

import { BaseScenario } from './base';
import { Record, convertToBoxModelForScenario } from '../box-model-definition';
import createModel from '../models/ice-albedo-feedback';
import { Simulation, SimulationResult } from '../simulation';
import {
  createExtractor,
  createSvgMorphUpdater,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  extendRangeRel,
  formatCelsiusFrac,
  kelvinToCelsius,
  loadSvg,
} from '../util';
import { createGraphCanvas } from '../charts/common';

import {
  RealtimeVsYChart,
  RealtimeVsYChartOptions,
} from '../charts/realtime-vs-y';
import {
  SolarEmissivityVsTemperatureChart,
  SolarEmissivityVsTemperatureChartOptions,
} from '../charts/solar-emissivity-vs-temperature';
import { preprocessSvg } from '../svg-utils';

const scenarioSvgUrl: URL = new URL(
  './../../svg/ice-albedo-feedback.svg',
  import.meta.url
);

type Resources = {
  svg: XMLDocument;
  initialRecord: Record;
  hysteresisData: SimulationResult[];
};

const model = createModel();
const modelForScenario = convertToBoxModelForScenario(model);

const SOLAR_EMISSIVITY_RANGE_FACTOR = 0.7;

export default class IceAlbedoFeedbackScenario extends BaseScenario {
  protected readonly svg;

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(
      elem,
      new Simulation(cloneDeep(modelForScenario)).setInitialRecord(
        resources.initialRecord
      )
    );

    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.getScene().appendChild(this.svg.node);

    const { min: minTemp, max: maxTemp } = extendRangeRel(
      model.variables.filter((v) => v.id === 'temperature')[0],
      0.2
    );

    const tempCanvas: HTMLCanvasElement = createGraphCanvas();
    this.getScene().appendChild(tempCanvas);

    const tempChartOptions: RealtimeVsYChartOptions = {
      numYears: model.numSteps,
      minY: kelvinToCelsius(minTemp),
      maxY: kelvinToCelsius(maxTemp),
      yAxisLabel: () => 'Temperatur [T]=°C',
      timeAxisTitle: () => 'Zeit [t]=Jahrtausend',
      timeTickStepSize: 1000,
      toYear: createYearExtractor(model),
      toYUnit: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'temperature'
      ),
      yDataFormatter: ({ y }) => formatCelsiusFrac(y),
      bgData: [],
    };
    const tempChart = new RealtimeVsYChart(tempCanvas, tempChartOptions);

    const solarEmissivityVsTempCanvas: HTMLCanvasElement = createGraphCanvas();
    this.getScene().appendChild(solarEmissivityVsTempCanvas);

    const solarEmissivityIdx = model.parameters.findIndex(
      ({ id }) => id === 'solar emissivity'
    );
    const { min: minEmissivity, max: maxEmissivity } = extendRangeRel(
      model.parameters[solarEmissivityIdx],
      SOLAR_EMISSIVITY_RANGE_FACTOR
    );

    const solarEmissivityVsTempChartOptions: SolarEmissivityVsTemperatureChartOptions =
      {
        numYears: 2000,
        minTemp: kelvinToCelsius(minTemp),
        maxTemp: kelvinToCelsius(maxTemp),
        minEmissivity,
        maxEmissivity,
        toYear: createYearExtractor(model),
        toSolarEmissivity: createExtractor(
          model,
          'parameters',
          'solar emissivity'
        ),
        toTemperatureCelsius: createTemperatureCelsiusExtractor(
          model,
          'variables',
          'temperature'
        ),
        hysteresisData: resources.hysteresisData,
      };
    const solarEmissivityVsTemperatureChart =
      new SolarEmissivityVsTemperatureChart(
        solarEmissivityVsTempCanvas,
        solarEmissivityVsTempChartOptions
      );

    this.updaters.push(
      tempChart,
      solarEmissivityVsTemperatureChart,
      ...this.createVizUpdaters()
    );
  }

  static fixScenarioSvg(svg: XMLDocument): void {
    // general fix-ups
    const parentClassName = 'ice-albedo-feedback-scenario';
    preprocessSvg(svg, parentClassName);

    // remove accidentally added class from non math-mode text
    const nonMathModeText = svg.querySelector('[id^=text02]');
    assert(nonMathModeText !== null);
    nonMathModeText.classList.remove('st35');
  }

  static async loadResources(): Promise<Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    IceAlbedoFeedbackScenario.fixScenarioSvg(svg);

    const simulation = new Simulation(cloneDeep(modelForScenario));
    const initialRecord = simulation.convergeRecordPrePost(
      simulation.getInitialModelRecord(),
      IceAlbedoFeedbackScenario.getConvergenceCriterion(0.001),
      { postProcess: (r: Record) => ({ ...r, t: 0 }) }
    );

    const hysteresisData = IceAlbedoFeedbackScenario.computeHysteresisData(
      SOLAR_EMISSIVITY_RANGE_FACTOR
    );

    return { svg, initialRecord, hysteresisData };
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Ice Albedo Feedback';
  }

  protected static getConvergenceCriterion(eps = 0.001): ConvergenceCriterion {
    const temperatureIdx = model.variables
      .map(({ id }) => id)
      .indexOf('temperature');

    const convergenceCriterion = (record: Record, lastRecord: Record) => {
      const temp = record.variables[temperatureIdx];
      const lastTemp = lastRecord.variables[temperatureIdx];
      return Math.abs(temp - lastTemp) < eps;
    };

    return convergenceCriterion;
  }

  protected static computeHysteresisData(
    solarEmissivityRangeFactor: number
  ): SimulationResult[] {
    const convergenceCriterion =
      IceAlbedoFeedbackScenario.getConvergenceCriterion();

    const hysteresisData: SimulationResult[] = [];
    const numSteps = 100;

    const simulation = new Simulation(cloneDeep(modelForScenario));
    const { min, max } = extendRangeRel(
      simulation.getParameterRange(),
      solarEmissivityRangeFactor
    );
    // walk the solar emissivity parameter down and back up
    for (let step = -numSteps + 1; step < numSteps; step += 1) {
      simulation.setParameter(
        min + ((max - min) * Math.abs(step)) / (numSteps - 1),
        true
      );
      const result = simulation.converge(convergenceCriterion);
      hysteresisData.push(result);
    }

    return hysteresisData;
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
      'variables',
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

    const earthInfraredRadiationVizUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'earth infrared radiation',
      this.svg,
      '[id^=arrowT]',
      '[id^=arrowT-min]',
      '[id^=arrowT-max]',
      'arrowT-in-between'
    );

    return [
      solarEmissivityVizUpdater,
      sunRadiationVizUpdater,
      albedoVizUpdater,
      reflectedSunRadiationVizUpdater,
      earthInfraredRadiationVizUpdater,
    ];
  }

  getMathModeElements() {
    const nonMathModeText = this.svg.findOne('[id^=text02]');
    assert(nonMathModeText !== null);

    const mathModeOverlay = this.svg.findOne('[id^=mathmode02]');
    assert(mathModeOverlay !== null);

    return {
      hide: [nonMathModeText.node],
      show: [mathModeOverlay.node],
    };
  }
}

export { IceAlbedoFeedbackScenario };
