import { SVG, Element as SVGElement } from '@svgdotjs/svg.js';

import { BaseScenario } from './base';
import { Record, convertToBoxModelForScenario } from '../box-model-definition';
import model from '../models/ice-albedo-feedback';
import { Simulation, SimulationResult } from '../simulation';
import {
  createExtractor,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  loadSvg,
} from '../util';

import { Chart } from '../chart';
import {
  TemperatureVsTimeChart,
  TemperatureVsTimeChartOptions,
} from '../charts/temperature-vs-time';
import {
  SolarEmissivityVsTemperatureChart,
  SolarEmissivityVsTemperatureChartOptions,
} from '../charts/solar-emissivity-vs-temperature';
import { ConvergenceCriterion } from '@imaginary-maths/box-model';
import assert from 'assert';

const scenarioSvgUrl: URL = new URL(
  './../../svg/scenario.svg',
  import.meta.url
);

type Resources = {
  svg: XMLDocument;
};

const modelForScenario = convertToBoxModelForScenario(model);

export default class IceAlbedoFeedbackScenario extends BaseScenario {
  protected readonly chart1: Chart;

  protected readonly chart2: Chart;

  protected readonly svg;

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(elem, new Simulation(modelForScenario));

    this.getSimulation().convergeInitialRecord(
      IceAlbedoFeedbackScenario.getConvergenceCriterion()
    );

    const scenarioLabel = document.createElement('div');
    scenarioLabel.innerText = this.getName();
    scenarioLabel.classList.add('label');
    this.getContainer().appendChild(scenarioLabel);

    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.getScene().appendChild(this.svg.node);

    const canvas1: HTMLCanvasElement = document.createElement('canvas');
    canvas1.width = 238;
    canvas1.height = 176;
    canvas1.classList.add('graph1');
    this.getScene().appendChild(canvas1);

    const chart1Options: TemperatureVsTimeChartOptions = {
      numYears: model.numSteps,
      minTemp: -70,
      maxTemp: 0,
      tempAxisLabel: () => 'Temperature (°C)',
      timeAxisTitle: () => 'Zeit (Jahrtausend)',
      timeTickStepSize: 1000,
      toYear: createYearExtractor(model),
      toTemperatureCelsius: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'temperature'
      ),
    };
    this.chart1 = new TemperatureVsTimeChart(canvas1, chart1Options);

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
    this.chart2 = new SolarEmissivityVsTemperatureChart(canvas2, chart2Options);
  }

  static async loadResources(): Promise<Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    return { svg };
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Ice Albedo Feedback';
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

  protected static computeHysteresisData(): SimulationResult[] {
    const convergenceCriterion =
      IceAlbedoFeedbackScenario.getConvergenceCriterion();

    const hysteresisData: SimulationResult[] = [];
    const numSteps = 100;

    const simulation = new Simulation(modelForScenario);
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

    const sunRays = this.svg.findOne('#sunrays-in') as SVGElement;
    if (sunRays) {
      sunRays.stroke({ width: 1 + relValue * (7 - 1) });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getMathModeElements() {
    return { hide: [], show: [] };
  }
}

export { IceAlbedoFeedbackScenario };
