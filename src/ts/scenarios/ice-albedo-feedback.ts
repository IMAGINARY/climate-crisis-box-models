import { SVG } from '@svgdotjs/svg.js';

import { BaseScenario } from './base';
import { Record } from '../box-model';
import model from '../models/ice-albedo-feedback';
import { Simulation, SimulationResult } from '../simulation';
import {
  createExtractor,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  loadSvg,
} from '../util';

// @ts-ignore
import scenarioSvgUrl from 'url:./../../svg/scenario.svg';
import { convertToBoxModelForScenario } from '../box-model-definition';
import Chart from '../chart';
import {
  TemperatureVsTimeChart,
  TemperatureVsTimeChartOptions,
} from '../charts/temperature-vs-time';
import {
  SolarEmissivityVsTemperatureChart,
  SolarEmissivityVsTemperatureChartOptions,
} from '../charts/solar-emissivity-vs-temperature';

namespace IceAlbedoFeedbackScenario {
  export type Resources = {
    svg: XMLDocument;
  };
}

export default class IceAlbedoFeedbackScenario extends BaseScenario {
  protected readonly chart1: Chart;
  protected readonly chart2: Chart;
  protected readonly svg;

  constructor(
    elem: HTMLDivElement,
    resources: IceAlbedoFeedbackScenario.Resources
  ) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));
    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.container.appendChild(this.svg.node);

    const canvas1: HTMLCanvasElement = document.createElement('canvas');
    canvas1.width = 400;
    canvas1.height = 300;
    canvas1.classList.add('graph1');
    this.container.appendChild(canvas1);

    const chart1Options: TemperatureVsTimeChartOptions = {
      numYears: model.numSteps,
      minTemp: -275,
      maxTemp: 40,
      toYear: createYearExtractor(model),
      toTemperatureCelsius: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'temperature'
      ),
    };
    this.chart1 = new TemperatureVsTimeChart(canvas1, chart1Options);

    const canvas2: HTMLCanvasElement = document.createElement('canvas');
    canvas2.width = 400;
    canvas2.height = 300;
    canvas2.classList.add('graph2');
    this.container.appendChild(canvas2);

    const solarEmissivityIdx = model.parameters.findIndex(
      ({ id }) => id === 'solar emissivity'
    );
    const { min: minEmissivity, max: maxEmissivity } = model.parameters[
      solarEmissivityIdx
    ];
    const chart2Options: SolarEmissivityVsTemperatureChartOptions = {
      numDataPoints: 2000,
      minTemp: -275,
      maxTemp: 40,
      minEmissivity,
      maxEmissivity,
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
    };
    this.chart2 = new SolarEmissivityVsTemperatureChart(canvas2, chart2Options);
  }

  static async loadResources(): Promise<IceAlbedoFeedbackScenario.Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    return { svg };
  }

  reset() {
    this.chart1.reset();
    this.chart2.reset();
    this.update([]);
  }

  protected update(newData: SimulationResult[]) {
    this.chart1.update(newData);
    this.chart2.update(newData);
    this.updateSolarEmissivity();
  }

  protected updateSolarEmissivity() {
    const simulation = this.getSimulation();
    const { min, max } = simulation.getParameterRange();
    const value = simulation.getParameter();
    const relValue = (value - min) / (max - min);

    const sunRays = this.svg.findOne('#sunrays-in');
    sunRays.each(function (i, children) {
      this.stroke({ width: 1 + relValue * (7 - 1) });
    });
  }
}

export { IceAlbedoFeedbackScenario };
