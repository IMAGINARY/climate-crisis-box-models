import assert from 'assert';
import * as SvgJs from '@svgdotjs/svg.js';

import { BaseScenario } from './base';
import model from '../models/earth-energy-balance';
import { Simulation, SimulationResult } from '../simulation';
import {
  createSvgMorphUpdater,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  loadSvg,
  VizUpdater,
} from '../util';

import { convertToBoxModelForScenario } from '../box-model-definition';
import { TemperatureVsTimeChart } from '../charts/temperature-vs-time';

const scenarioSvgUrl: URL = new URL(
  './../../svg/earth-energy-balance.svg',
  import.meta.url
);

export type Resources = {
  svg: XMLDocument;
};

export default class EarthEnergyBalanceScenario extends BaseScenario {
  protected readonly chart: TemperatureVsTimeChart;

  protected readonly svg;

  private readonly vizUpdaters: VizUpdater[] = [];

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));
    this.svg = SvgJs.SVG(
      document.importNode(resources.svg.documentElement, true)
    );
    this.getScene().appendChild(this.svg.node);

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 270;
    canvas.height = 190;
    canvas.classList.add('graph');
    this.getScene().appendChild(canvas);

    this.chart = new TemperatureVsTimeChart(canvas, {
      numYears: model.numSteps,
      minTemp: -275,
      maxTemp: 15,
      toYear: createYearExtractor(model),
      toTemperatureCelsius: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'temperature'
      ),
    });

    this.vizUpdaters = this.createVizUpdaters();
  }

  static fixScenarioSvg(svg: XMLDocument): void {
    const iceMax = svg.querySelector('[id^=ice-max_]') as SVGGElement;
    assert(iceMax !== null);
    const iceMaxPolygons = Array.from(iceMax.children);
    const idxMap = [7, 8, 0, 1, 2, 3, 4, 5, 6];
    const iceMaxPolygonsReordered = iceMaxPolygons.map(
      (p, i) => iceMaxPolygons[idxMap[i]]
    );
    iceMax.replaceChildren(...iceMaxPolygonsReordered);
  }

  static async loadResources(): Promise<Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    EarthEnergyBalanceScenario.fixScenarioSvg(svg);
    return { svg };
  }

  reset() {
    this.chart.reset();
    this.update([]);
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Earth Energy Balance';
  }

  protected createVizUpdaters() {
    const albedoVizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'albedo',
      this.svg,
      '[id=ice]',
      '[id^=ice-min_]',
      '[id^=ice-max_]',
      'ice-in-between'
    );

    const solarEmissivityVizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'albedo',
      this.svg,
      '[id^=sun_]',
      '[id=sun-min]',
      '[id=sun-max]',
      'sun-in-between'
    );

    return [albedoVizUpdater, solarEmissivityVizUpdater];
  }

  protected update(newResults: SimulationResult[]) {
    this.chart.update(newResults);

    if (newResults.length > 0) {
      const lastResult = newResults[newResults.length - 1];
      this.vizUpdaters.forEach((vizUpdater) => vizUpdater(lastResult));
    }
  }
}

export { EarthEnergyBalanceScenario };
