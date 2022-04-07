import assert from 'assert';
import * as SvgJs from '@svgdotjs/svg.js';
import { ConvergenceCriterion } from '@imaginary-maths/box-model/dist/box-model';

import { BaseScenario } from './base';
import model from '../models/earth-energy-balance';
import { Simulation } from '../simulation';
import {
  createSvgMorphUpdater,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  kelvinToCelsius,
  loadSvg,
} from '../util';
import { preprocessSvg } from '../svg-utils';

import { convertToBoxModelForScenario, Record } from '../box-model-definition';
import { TemperatureVsTimeChart } from '../charts/temperature-vs-time';

const scenarioSvgUrl: URL = new URL(
  './../../svg/earth-energy-balance.svg',
  import.meta.url
);

export type Resources = {
  svg: XMLDocument;
};

export default class EarthEnergyBalanceScenario extends BaseScenario {
  protected readonly svg;

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));

    this.getSimulation().convergeInitialRecord(
      EarthEnergyBalanceScenario.getConvergenceCriterion()
    );

    this.svg = SvgJs.SVG(
      document.importNode(resources.svg.documentElement, true)
    );
    this.getScene().appendChild(this.svg.node);

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 238;
    canvas.height = 176;
    canvas.classList.add('graph');
    this.getScene().appendChild(canvas);

    const { min, max } = model.variables.filter(
      (v) => v.id === 'temperature'
    )[0];

    const chart = new TemperatureVsTimeChart(canvas, {
      numYears: model.numSteps,
      minTemp: kelvinToCelsius(min),
      maxTemp: kelvinToCelsius(max),
      tempAxisLabel: () => 'Temperature (°C)',
      timeAxisTitle: () => 'Zeit (Jahrtausend)',
      timeTickStepSize: 1000,
      toYear: createYearExtractor(model),
      toTemperatureCelsius: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'temperature'
      ),
    });

    this.updaters.push(chart, ...this.createVizUpdaters());
  }

  static fixScenarioSvg(svg: XMLDocument): void {
    // fix mapping between ice min and max polygons
    const iceMax = svg.querySelector('[id^=ice-max_]') as SVGGElement;
    assert(iceMax !== null);
    const iceMaxPolygons = Array.from(iceMax.children);
    const idxMap = [7, 8, 0, 1, 2, 3, 4, 5, 6];
    const iceMaxPolygonsReordered = iceMaxPolygons.map(
      (p, i) => iceMaxPolygons[idxMap[i]]
    );
    iceMax.replaceChildren(...iceMaxPolygonsReordered);

    // general fix-ups
    const classPrefix = 'earth-energy-balance-scenario-svg-';
    preprocessSvg(svg, classPrefix);
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

  protected static getConvergenceCriterion(): ConvergenceCriterion {
    const temperatureIdx = model.variables
      .map(({ id }) => id)
      .indexOf('temperature');

    const convergenceCriterion = (record: Record, lastRecord: Record) => {
      const temp = record.variables[temperatureIdx];
      const lastTemp = lastRecord.variables[temperatureIdx];
      return Math.abs(temp - lastTemp) < 0.001;
    };

    return convergenceCriterion;
  }

  // eslint-disable-next-line class-methods-use-this
  getMathModeElements() {
    return {
      hide: [],
      show: [],
    };
  }
}

export { EarthEnergyBalanceScenario };
