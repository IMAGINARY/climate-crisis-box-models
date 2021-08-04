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
        parsing: false,
        normalized: true,
        animation: false,
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

    /*
     * Due to a bug in Chart.js 3.x, we need to splice() first, then push(),
     * which makes updating the data set slightly cumbersome.
     * @see {@link https://github.com/chartjs/Chart.js/issues/9511}
     */
    const { numYears } = this.options;
    const newDataPoints = newResults.slice(-numYears).map(createDataPoint);
    const totalNumDataPoints = newDataPoints.length + data.length;
    data.splice(0, Math.max(0, totalNumDataPoints - numYears));
    data.push(...newDataPoints);

    const { x: xScale } = this.chart.config.options.scales;
    xScale.max = data.length > 0 ? data[data.length - 1].x : xStart - 1;
    xScale.min = xScale.max - numYears + 1;

    this.chart.update();
  }
}

export { TemperatureVsTimeChart };
