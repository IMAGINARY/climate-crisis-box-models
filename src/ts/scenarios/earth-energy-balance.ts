import assert from 'assert';
import * as SvgJs from '@svgdotjs/svg.js';

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
  protected readonly svg;

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));
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

    const pathElements = svg.querySelectorAll('path');
    pathElements.forEach((pathElement) => {
      const d = pathElement.getAttribute('d');
      if (d !== null) {
        const dFixed = d.replaceAll(/\s+/g, ' ').trim();
        pathElement.setAttribute('d', dFixed);
      }
    });

    // hide the hard-coded graph
    const graph = svg.querySelector('[id^=graph1]') as SVGGElement;
    if (graph !== null) graph.style.display = 'none';

    // assign a transform origin to the layers of the sun
    // the actual animation is done via CSS animations
    const sunOrigin = svg.querySelector('[id^=sun-anchor]') as SVGElement;
    assert(sunOrigin !== null);
    const cx = sunOrigin.getAttribute('cx');
    const cy = sunOrigin.getAttribute('cy');
    assert(cx !== null && cy !== null);

    const sunLayers: NodeListOf<SVGElement> = svg.querySelectorAll(
      '[id^=sun-min] > *, [id^=sun-max] > *'
    );
    assert(sunLayers.length !== 0);
    Array.from(sunLayers).forEach((sunLayer) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,no-param-reassign
      sunLayer.style.transformOrigin = `${cx}px ${cy}px`;
    });
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
}

export { EarthEnergyBalanceScenario };
