import { BaseScenarioView, BaseScenarioController } from './base';
import { convertToBoxModelForScenario } from '../box-model-definition';

import { Record } from '../box-model';
import model from '../models/ice-albedo-feedback';
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
const solarEmissivityIdx = model.parameters.findIndex(
  ({ id }) => id === 'solar emissivity'
);
function getSolarEmissivity(r: Record) {
  return r.parameters[solarEmissivityIdx];
}

class IceAlbedoFeedbackScenarioView extends BaseScenarioView {
  protected readonly chart1: Chart;
  protected readonly chart2: Chart;
  protected lastResultTimestamp: number = 0;

  constructor(elem: HTMLDivElement, simulation: Simulation) {
    super(elem, simulation);
    const { chart1, chart2 } = this.init();
    this.chart1 = chart1;
    this.chart2 = chart2;
  }

  private init() {
    const temperatureFormatter = new Intl.NumberFormat('de', {
      maximumFractionDigits: 1,
    });

    const chart1Data = {
      labels: Array(numSteps)
        .fill(null)
        .map((_, i) => -(numSteps - i - 1)),
      datasets: [
        {
          label: 'Temperature',
          data: new Array(numSteps).fill(undefined),
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          borderJoinStyle: 'bevel',
        },
      ],
    };
    const chart1Config = {
      type: 'line' as keyof ChartTypeRegistry,
      data: chart1Data,
      options: {
        radius: 0,
        scales: {
          y: {
            min: -274,
            max: 40,
            ticks: {
              callback: (value) => `${temperatureFormatter.format(value)}°C`,
            },
          },
        },
      },
    };

    const canvas1: HTMLCanvasElement = document.createElement('canvas');
    this.container.appendChild(canvas1);

    const chart1 = new Chart(canvas1, chart1Config);

    const chart2Data = {
      datasets: [
        {
          label: 'Solar emissivity vs. Temperature',
          data: new Array(200).fill({ x: undefined, y: undefined }),
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          borderJoinStyle: 'bevel',
        },
        {
          label: 'Last datapoint',
          data: [{ x: undefined, y: undefined }],
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(75, 192, 192)',
          radius: 5,
          showLine: false,
        },
      ],
    };
    const { min: chart2XMin, max: chart2XMax } = model.parameters[
      solarEmissivityIdx
    ];
    const chart2XSize = chart2XMax - chart2XMin;
    const chart2Config = {
      type: 'scatter' as keyof ChartTypeRegistry,
      data: chart2Data,
      options: {
        radius: 0,
        showLine: true,
        scales: {
          x: {
            type: 'linear',
            min: chart2XMin - 0.1 * chart2XSize,
            max: chart2XMax + 0.1 * chart2XSize,
          },
          y: {
            type: 'linear',
            min: -274,
            max: 40,
            ticks: {
              callback: (value) => `${temperatureFormatter.format(value)}°C`,
            },
          },
        },
      },
    };

    const canvas2: HTMLCanvasElement = document.createElement('canvas');
    this.container.appendChild(canvas2);

    const chart2 = new Chart(canvas2, chart2Config);

    return { chart1, chart2 };
  }

  update() {
    const newChart1Data = [];
    const newChart2Data: { x: number; y: number }[] = [];

    const { results } = this.simulation;
    for (let i = results.length - 1; i >= 0; i -= 1) {
      const [timestamp, record] = results[i];
      if (timestamp > this.lastResultTimestamp) {
        const temperature = getTemperatureCelsius(record);
        const solarEmissivity = getSolarEmissivity(record);
        newChart1Data.unshift(temperature);
        newChart2Data.unshift({ x: solarEmissivity, y: temperature });
      } else {
        break;
      }
    }

    const { data: chart1Data } = this.chart1.config.data.datasets[0];
    const c1l = chart1Data.length;
    chart1Data.splice(0, newChart1Data.length);
    newChart1Data.splice(0, Math.max(0, newChart1Data.length - c1l));
    chart1Data.push(...newChart1Data);

    const { data: chart2Data } = this.chart2.config.data.datasets[0];
    const c2l = chart2Data.length;
    chart2Data.splice(0, newChart2Data.length);
    newChart2Data.splice(0, Math.max(0, newChart2Data.length - c2l));
    chart2Data.push(...newChart2Data);

    this.chart2.config.data.datasets[1].data[0] =
      chart2Data.length > 0
        ? chart2Data[chart2Data.length - 1]
        : { x: undefined, y: undefined };

    if (results.length > 0) {
      const [timestamp] = results[results.length - 1];
      this.lastResultTimestamp = timestamp;
    }

    this.chart1.update('resize');
    this.chart2.update('resize');
  }
}

export default class IceAlbedoFeedbackScenarioController extends BaseScenarioController {
  constructor(elem) {
    super(
      new IceAlbedoFeedbackScenarioView(elem, {
        model: convertToBoxModelForScenario(model),
        results: [],
      })
    );
  }
}

export { IceAlbedoFeedbackScenarioController };
