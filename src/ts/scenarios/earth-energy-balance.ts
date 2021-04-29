import { BaseScenarioView, BaseScenarioController } from './base';
import { convertToBoxModelForScenario } from '../box-model-definition';

import { Record } from '../box-model';
import model from '../models/earth-energy-balance';
import { Simulation } from '../scenario';
import { ChartTypeRegistry } from 'chart.js';
import Chart from 'chart.js/auto';

const { numSteps } = model;
const temperatureIdx = model.variables.findIndex(
  ({ id }) => id === 'temperature'
);
function getTemperatureCelsius(r: Record) {
  return r.variables[temperatureIdx] - 273.15;
}

class EarthEnergyBalanceView extends BaseScenarioView {
  protected readonly data: number[];
  protected readonly chart: Chart;
  protected lastResultTimestamp: number = 0;

  constructor(elem: HTMLDivElement, simulation: Simulation) {
    super(elem, simulation);
    const { chart, data } = this.init();
    this.data = data;
    this.chart = chart;
  }

  private init() {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
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
        radius: 0,
        scales: {
          y: {
            min: -274,
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
}

export default class EarthEnergyBalanceScenarioController extends BaseScenarioController {
  constructor(elem) {
    super(
      new EarthEnergyBalanceView(elem, {
        model: convertToBoxModelForScenario(model),
        results: [],
      })
    );
  }
}

export { EarthEnergyBalanceScenarioController };
