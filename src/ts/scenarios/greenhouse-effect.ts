import { SVG } from '@svgdotjs/svg.js';
import { takeRightWhile } from 'lodash/findLastIndex';

import { BaseScenarioView, BaseScenarioController } from './base';
import { convertToBoxModelForScenario } from '../box-model-definition';
// @ts-ignore
import scenarioSvgUrl from 'url:./../../svg/scenario.svg';

import { Record } from '../box-model';
import model from '../models/greenhouse-effect';
import { Simulation } from '../scenario';
import { ChartTypeRegistry } from 'chart.js';
import Chart from 'chart.js/auto';
import { loadSvg } from '../util';
import { BoxModel } from '@imaginary-maths/box-model';

const { numSteps } = model;
const temperatureIdx = model.variables.findIndex(
  ({ id }) => id === 'gnd temperature'
);

function getTemperatureCelsius(r: Record) {
  return r.variables[temperatureIdx] - 273.15;
}

const co2Idx = model.parameters.findIndex(({ id }) => id === 'co2');

function getCO2(r: Record | BoxModel) {
  return r.parameters[co2Idx];
}

namespace GreenhouseEffectView {
  export type Resources = {
    svg: XMLDocument;
  };
}

class GreenhouseEffectView extends BaseScenarioView {
  protected readonly data: number[];
  protected readonly chart: Chart;
  protected lastResultTimestamp: number = 0;
  protected readonly svg;

  constructor(
    elem: HTMLDivElement,
    simulation: Simulation,
    resources: GreenhouseEffectView.Resources
  ) {
    super(elem, simulation);
    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    const { chart, data } = this.init();
    this.data = data;
    this.chart = chart;
  }

  static async loadResources() {
    const svg = await loadSvg(scenarioSvgUrl);
    return { svg };
  }

  private init() {
    this.container.appendChild(this.svg.node);

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    canvas.classList.add('graph');
    this.container.appendChild(canvas);

    const data = new Array(numSteps).fill(undefined);

    const chartData = {
      labels: Array(numSteps)
        .fill(null)
        .map((_, i) => -(numSteps - i - 1)),
      datasets: [
        {
          label: 'Temperature',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: data,
          borderJoinStyle: 'bevel',
        },
      ],
    };
    const temperatureFormatter = new Intl.NumberFormat('de', {
      maximumFractionDigits: 1,
    });
    const chartConfig = {
      type: 'line' as keyof ChartTypeRegistry,
      data: chartData,
      options: {
        responsive: false,
        radius: 0,
        scales: {
          y: {
            min: 10,
            max: 30,
            ticks: {
              callback: (value) => `${temperatureFormatter.format(value)}°C`,
            },
          },
        },
      },
    };

    const chart = new Chart(canvas, chartConfig);

    return { chart, data };
  }

  update() {
    this.updateGraph();
    this.updateCO2();
  }

  updateGraph() {
    const { results } = this.simulation;
    const newData = [];
    for (let i = results.length - 1; i >= 0; i -= 1) {
      const [timestamp, record] = results[i];
      if (timestamp > this.lastResultTimestamp) {
        newData.unshift(getTemperatureCelsius(record));
      } else {
        break;
      }
    }
    this.data.splice(0, newData.length);
    this.data.push(...newData);
    if (results.length > 0) {
      const [timestamp] = results[results.length - 1];
      this.lastResultTimestamp = timestamp;
    }
    this.chart.update('resize');
  }

  updateCO2() {
    const { model } = this.simulation;
    const { min, max, value } = model.parameters[co2Idx];
    const relValue = (value - min) / (max - min);
    const scale = 0.5 + (3 + 0.5) * relValue;

    const co2 = this.svg.findOne('#co2');
    co2.transform({ scale });
  }
}

namespace GreenhouseEffectScenarioController {
  export type Resources = {
    svg: XMLDocument;
  };
}

export default class GreenhouseEffectScenarioController extends BaseScenarioController {
  constructor(elem, resources: GreenhouseEffectScenarioController.Resources) {
    super(
      new GreenhouseEffectView(
        elem,
        {
          model: convertToBoxModelForScenario(model),
          results: [],
        },
        resources
      )
    );
  }

  static async loadResources() {
    return GreenhouseEffectView.loadResources();
  }
}

export { GreenhouseEffectScenarioController };
