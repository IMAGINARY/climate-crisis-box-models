import { SVG } from '@svgdotjs/svg.js';

import { BaseScenario } from './base';
import model from '../models/greenhouse-effect';
import { Simulation, SimulationResult } from '../simulation';
import {
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  loadSvg,
} from '../util';

// @ts-ignore
import scenarioSvgUrl from 'url:./../../svg/scenario.svg';
import { convertToBoxModelForScenario } from '../box-model-definition';
import TemperatureVsTimeChart, {
  TemperatureVsTimeChartOptions,
} from '../charts/temperature-vs-time';

namespace GreenhouseEffectScenario {
  export type Resources = {
    svg: XMLDocument;
  };
}

export default class GreenhouseEffectScenario extends BaseScenario {
  protected readonly chart: TemperatureVsTimeChart;
  protected readonly svg;

  constructor(
    elem: HTMLDivElement,
    resources: GreenhouseEffectScenario.Resources
  ) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));
    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.container.appendChild(this.svg.node);

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    canvas.classList.add('graph');
    this.container.appendChild(canvas);

    const chartOptions: TemperatureVsTimeChartOptions = {
      numYears: model.numSteps,
      minTemp: 10,
      maxTemp: 30,
      toYear: createYearExtractor(model),
      toTemperatureCelsius: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'gnd temperature'
      ),
    };
    this.chart = new TemperatureVsTimeChart(canvas, chartOptions);
  }

  static async loadResources(): Promise<GreenhouseEffectScenario.Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    return { svg };
  }

  reset() {
    this.chart.reset();
    this.update([]);
  }

  protected update(newResults: SimulationResult[]) {
    this.chart.update(newResults);
    this.updateCO2();
  }

  protected updateCO2() {
    const simulation = this.getSimulation();
    const { min, max } = simulation.getParameterRange();
    const value = simulation.getParameter();
    const relValue = (value - min) / (max - min);
    const scale = 0.5 + (3 + 0.5) * relValue;

    const co2 = this.svg.findOne('#co2');
    co2.transform({ scale });
  }
}

export { GreenhouseEffectScenario };
