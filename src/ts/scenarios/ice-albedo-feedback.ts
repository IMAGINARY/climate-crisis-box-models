import assert from 'assert';
import cloneDeep from 'lodash/cloneDeep';
import { SVG, Element as SVGElement } from '@svgdotjs/svg.js';
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
  formatCelsiusFrac,
  loadSvg,
} from '../util';

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
};

const model = createModel();
const modelForScenario = convertToBoxModelForScenario(model);

export default class IceAlbedoFeedbackScenario extends BaseScenario {
  protected readonly svg;

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(
      elem,
      new Simulation(cloneDeep(modelForScenario)).convergeInitialModelRecord(
        IceAlbedoFeedbackScenario.getConvergenceCriterion(0.001),
        { postProcess: (r: Record) => ({ ...r, t: 0 }) }
      )
    );

    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.getScene().appendChild(this.svg.node);

    const canvas1: HTMLCanvasElement = document.createElement('canvas');
    canvas1.width = 238;
    canvas1.height = 176;
    canvas1.classList.add('graph1');
    this.getScene().appendChild(canvas1);

    const chart1Options: RealtimeVsYChartOptions = {
      numYears: model.numSteps,
      minY: -70,
      maxY: 0,
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
    const chart1 = new RealtimeVsYChart(canvas1, chart1Options);

    const canvas2: HTMLCanvasElement = document.createElement('canvas');
    canvas2.width = 238;
    canvas2.height = 176;
    canvas2.classList.add('graph2');
    this.getScene().appendChild(canvas2);

    const solarEmissivityIdx = model.parameters.findIndex(
      ({ id }) => id === 'solar emissivity'
    );
    const { min: minEmissivity, max: maxEmissivity } =
      model.parameters[solarEmissivityIdx];
    const chart2Options: SolarEmissivityVsTemperatureChartOptions = {
      numYears: 2000,
      minTemp: -70,
      maxTemp: 0,
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
      hysteresisData: IceAlbedoFeedbackScenario.computeHysteresisData(),
    };
    const chart2 = new SolarEmissivityVsTemperatureChart(
      canvas2,
      chart2Options
    );

    this.updaters.push(chart1, chart2, ...this.createVizUpdaters());
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
    return { svg };
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

  protected static computeHysteresisData(): SimulationResult[] {
    const convergenceCriterion =
      IceAlbedoFeedbackScenario.getConvergenceCriterion();

    const hysteresisData: SimulationResult[] = [];
    const numSteps = 100;

    const simulation = new Simulation(cloneDeep(modelForScenario));
    const { min, max } = simulation.getParameterRange();
    const extMin = min - (max - min) * 0.1;
    const extMax = max + (max - min) * 0.1;
    // walk the solar emissivity parameter down and back up
    for (let step = -numSteps + 1; step < numSteps; step += 1) {
      simulation.setParameter(
        extMin + ((extMax - extMin) * Math.abs(step)) / (numSteps - 1),
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
