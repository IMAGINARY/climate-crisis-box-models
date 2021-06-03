import { ChartTypeRegistry } from 'chart.js';
import ChartJs from 'chart.js/auto';

import { Chart } from '../chart';
import { SimulationResult } from '../simulation';
import { formatCelsius } from '../util';

export type TemperatureVsTimeChartOptions = {
  numYears: number;
  minTemp: number;
  maxTemp: number;
  toTemperatureCelsius: (result: SimulationResult) => number;
  toYear: (result: SimulationResult) => number;
};

export default class TemperatureVsTimeChart implements Chart {
  protected readonly chart: ChartJs;
  protected options: TemperatureVsTimeChartOptions;
  protected count: number;

  constructor(
    canvas: HTMLCanvasElement,
    options: TemperatureVsTimeChartOptions
  ) {
    this.options = options;
    const data = [];

    const chartData = {
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
    const chartConfig = {
      type: 'scatter' as keyof ChartTypeRegistry,
      data: chartData,
      options: {
        responsive: false,
        radius: 0,
        showLine: true,
        scales: {
          x: {
            type: 'linear',
            min: -this.options.numYears,
            max: -1,
          },
          y: {
            type: 'linear',
            min: this.options.minTemp,
            max: this.options.maxTemp,
            ticks: {
              callback: formatCelsius,
            },
          },
        },
      },
    };

    this.chart = new ChartJs(canvas, chartConfig);
  }

  reset() {
    const data = this.chart.data.datasets[0].data;
    const xScale = this.chart.config.options.scales.x;
    xScale.max = -1;
    xScale.min = -this.count;

    data.splice(0, data.length);

    this.update([]);
  }

  update(newResults: SimulationResult[]) {
    const data = this.chart.data.datasets[0].data;
    const xStart = data.length > 0 ? data[data.length - 1].x + 1 : 0;

    const { toTemperatureCelsius, toYear } = this.options;
    const createDataPoint = (r: SimulationResult) => ({
      x: toYear(r),
      y: toTemperatureCelsius(r),
    });

    const newDataPoints = newResults.map(createDataPoint);
    data.push(...newDataPoints);
    data.splice(0, Math.max(0, data.length - this.options.numYears));

    const xScale = this.chart.config.options.scales.x;
    xScale.max = data.length > 0 ? data[data.length - 1].x : xStart - 1;
    xScale.min = xScale.max - this.options.numYears + 1;

    this.chart.update('resize');
  }
}

export { TemperatureVsTimeChart };
