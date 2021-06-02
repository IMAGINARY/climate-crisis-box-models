import { SVG } from '@svgdotjs/svg.js';
import { ChartTypeRegistry } from 'chart.js';
import Chart from 'chart.js/auto';

import { BaseScenario } from './base';
import { Record } from '../box-model';
import model from '../models/earth-energy-balance';
import { Simulation, SimulationResult } from '../simulation';
import { loadSvg } from '../util';

// @ts-ignore
import scenarioSvgUrl from 'url:./../../svg/scenario.svg';
import { convertToBoxModelForScenario } from '../box-model-definition';

const { numSteps } = model;
const temperatureIdx = model.variables.findIndex(
  ({ id }) => id === 'temperature'
);
function getTemperatureCelsius(r: Record) {
  return r.variables[temperatureIdx] - 273.15;
}

namespace EarthEnergyBalanceScenario {
  export type Resources = {
    svg: XMLDocument;
  };
}

export default class EarthEnergyBalanceScenario extends BaseScenario {
  protected readonly data: number[];
  protected readonly chart: Chart;
  protected readonly svg;

  constructor(
    elem: HTMLDivElement,
    resources: EarthEnergyBalanceScenario.Resources
  ) {
    super(elem, new Simulation(convertToBoxModelForScenario(model)));
    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    const { chart, data } = this.init();
    this.data = data;
    this.chart = chart;
  }

  static async loadResources(): Promise<EarthEnergyBalanceScenario.Resources> {
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
            min: -275,
            max: 15,
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

  protected update(newData: SimulationResult[]) {
    const newRecords = newData.map(([_, record]) => record);
    this.updateChart(newRecords);
    this.updateAlbedo();
  }

  protected updateChart(newRecords: Record[]) {
    const newTemperatures = newRecords.map(getTemperatureCelsius);
    this.data.splice(0, newTemperatures.length);
    this.data.push(...newTemperatures);
    this.chart.update('resize');
  }

  protected updateAlbedo() {
    const simulation = this.getSimulation();
    const { min, max } = simulation.getParameterRange();
    const value = simulation.getParameter();
    const relValue = (value - min) / (max - min);
  }
}

export { EarthEnergyBalanceScenario };
