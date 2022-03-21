import { SVG } from '@svgdotjs/svg.js';

import { BaseScenario } from './base';
import model from '../models/earth-energy-balance';
import { Simulation, SimulationResult } from '../simulation';
import {
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  loadSvg,
} from '../util';

// @ts-ignore
import scenarioSvgUrl from 'url:./../../svg/scenario.svg';
import { convertToBoxModelForScenario } from '../box-model-definition';
import { SECONDS_PER_YEAR } from '../constants';
import TemperatureVsTimeChart from '../charts/temperature-vs-time';

namespace EarthEnergyBalanceScenario {
  export type Resources = {
    svg: XMLDocument;
  };
}

export default class EarthEnergyBalanceScenario extends BaseScenario {
  protected readonly chart: TemperatureVsTimeChart;
  protected readonly svg;

  constructor(
    elem: HTMLDivElement,
    resources: EarthEnergyBalanceScenario.Resources
  ) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));
    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
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
  }

  static async loadResources(): Promise<EarthEnergyBalanceScenario.Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    return { svg };
  }

  reset() {
    this.chart.reset();
    this.update([]);
  }

  getName() {
    return 'Earth Energy Balance';
  }

  protected update(newResults: SimulationResult[]) {
    this.chart.update(newResults);
    this.updateAlbedo();
  }

  protected updateAlbedo() {
    const simulation = this.getSimulation();
    const { min, max } = simulation.getParameterRange();
    const value = simulation.getParameter();
    const relValue = (value - min) / (max - min);
  }
}

export { EarthEnergyBalanceScenario };
