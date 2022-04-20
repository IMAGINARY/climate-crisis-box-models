import assert from 'assert';
import cloneDeep from 'lodash/cloneDeep';
import * as SvgJs from '@svgdotjs/svg.js';
import { ConvergenceCriterion } from '@imaginary-maths/box-model';

import { BaseScenario } from './base';
import createModel from '../models/earth-energy-balance';
import { Simulation } from '../simulation';
import {
  createAlbedoExtractor,
  createSvgMorphUpdater,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  extendRangeRel,
  formatAlbedo,
  formatCelsiusFrac,
  kelvinToCelsius,
  loadSvg,
} from '../util';
import { createGraphCanvas } from '../charts/common';
import { preprocessSvg } from '../svg-utils';

import { convertToBoxModelForScenario, Record } from '../box-model-definition';
import { RealtimeVsYChart } from '../charts/realtime-vs-y';

const scenarioSvgUrl: URL = new URL(
  './../../svg/earth-energy-balance.svg',
  import.meta.url
);

export type Resources = {
  svg: XMLDocument;
};

const model = createModel();

export default class EarthEnergyBalanceScenario extends BaseScenario {
  protected readonly svg;

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(
      elem,
      new Simulation(
        convertToBoxModelForScenario(cloneDeep(model))
      ).convergeInitialModelRecord(
        EarthEnergyBalanceScenario.getConvergenceCriterion(0.001),
        { postProcess: (r: Record) => ({ ...r, t: 0 }) }
      )
    );

    this.svg = SvgJs.SVG(
      document.importNode(resources.svg.documentElement, true)
    );
    this.getScene().appendChild(this.svg.node);

    const tempCanvas: HTMLCanvasElement = createGraphCanvas();
    this.getScene().appendChild(tempCanvas);

    const { min: minTemp, max: maxTemp } = extendRangeRel(
      model.variables.filter((v) => v.id === 'temperature')[0],
      0.2
    );

    const tempChart = new RealtimeVsYChart(tempCanvas, {
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
    });

    const albedoCanvas: HTMLCanvasElement = createGraphCanvas();
    this.getScene().appendChild(albedoCanvas);

    const { min: minAlbedo, max: maxAlbedo } = extendRangeRel(
      model.parameters.filter((p) => p.id === 'albedo')[0],
      0.2
    );

    const albedoChart = new RealtimeVsYChart(albedoCanvas, {
      numYears: model.numSteps,
      minY: minAlbedo * 100,
      maxY: maxAlbedo * 100,
      yAxisLabel: () => 'Albedo [α]=%',
      timeAxisTitle: () => 'Zeit [t]=Jahrtausend',
      timeTickStepSize: 1000,
      toYear: createYearExtractor(model),
      toYUnit: createAlbedoExtractor(model, 'parameters', 'albedo'),
      yDataFormatter: ({ y }) => formatAlbedo(y),
      bgData: [],
    });

    this.updaters.push(tempChart, albedoChart, ...this.createVizUpdaters());
  }

  static fixScenarioSvg(svg: XMLDocument): void {
    // general fix-ups
    const parentClassName = 'earth-energy-balance-scenario';
    preprocessSvg(svg, parentClassName);
  }

  static async loadResources(): Promise<Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    EarthEnergyBalanceScenario.fixScenarioSvg(svg);
    return { svg };
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Earth Energy Balance';
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

  getMathModeElements() {
    const nonMathModeText = this.svg.findOne('[id^=text01]');
    assert(nonMathModeText !== null);

    const mathModeOverlay = this.svg.findOne('[id^=mathmode01]');
    assert(mathModeOverlay !== null);

    return {
      hide: [nonMathModeText.node],
      show: [mathModeOverlay.node],
    };
  }
}

export { EarthEnergyBalanceScenario };
