import { SVG } from '@svgdotjs/svg.js';
import { ChartTypeRegistry } from 'chart.js';
import Chart from 'chart.js/auto';

import { BaseScenario } from './base';
import { BoxModel, Record } from '../box-model';
import model from '../models/greenhouse-effect';
import { Simulation, SimulationResult } from '../simulation';
import { loadSvg } from '../util';

// @ts-ignore
import scenarioSvgUrl from 'url:./../../svg/scenario.svg';
import { convertToBoxModelForScenario } from '../box-model-definition';

const { numSteps } = model;
const temperatureIdx = model.variables.findIndex(
  ({ id }) => id === 'gnd temperature'
);

function getTemperatureCelsius(r: Record) {
  return r.variables[temperatureIdx] - 273.15;
}

namespace GreenhouseEffectScenario {
  export type Resources = {
    svg: XMLDocument;
  };
}

export default class GreenhouseEffectScenario extends BaseScenario {
  protected readonly data: number[];
  protected readonly chart: Chart;
  protected readonly svg;

  constructor(
    elem: HTMLDivElement,
    resources: GreenhouseEffectScenario.Resources
  ) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));
    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    const { chart, data } = this.init();
    this.data = data;
    this.chart = chart;
  }

  static async loadResources(): Promise<GreenhouseEffectScenario.Resources> {
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

  reset() {
    // TODO
  }

  protected update(newData: SimulationResult[]) {
    const newRecords = newData.map(([_, record]) => record);
    this.updateChart(newRecords);
    this.updateCO2();
  }

  protected updateChart(newRecords: Record[]) {
    const newTemperatures = newRecords.map(getTemperatureCelsius);
    this.data.splice(0, newTemperatures.length);
    this.data.push(...newTemperatures);
    this.chart.update('resize');
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
