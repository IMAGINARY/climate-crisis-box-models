import { ChartTypeRegistry } from 'chart.js';
import ChartJs from 'chart.js/auto';
import { first, last } from 'lodash';

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
          pointRadius: 0,
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
        showLine: true,
        tension: 0,
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
    const { toTemperatureCelsius, toYear } = this.options;
    const createDataPoint = (r: SimulationResult) => ({
      x: toYear(r),
      y: toTemperatureCelsius(r),
    });

    /*
     * Due to a bug in Chart.js 3.x, we need to unshift() first, then push(),
     * which makes updating the data set slightly cumbersome.
     * @see {@link https://github.com/chartjs/Chart.js/issues/9511}
     */
    const data = this.chart.data.datasets[0].data;
    const { numYears } = this.options;
    const newDataPoints = newResults.map(createDataPoint);
    const { x: maxYear } = last(newDataPoints) ?? last(data) ?? { x: -1 };
    const minYear = maxYear - numYears + 1;
    if (true) {
      // to be used as long as there is no fix for the Chart.js bug
      while (first(data)?.x < minYear) data.shift();
      if (first(newDataPoints)?.x < minYear) {
        const newDataPointsClone = [...newDataPoints];
        while (first(newDataPointsClone)?.x < minYear)
          newDataPointsClone.shift();
        data.push(...newDataPointsClone);
      } else {
        data.push(...newDataPoints);
      }
    } else {
      data.push(...newDataPoints);
      const idx = data.findIndex(({ x }) => x >= minYear);
      data.splice(0, idx);
    }

    Object.assign(this.chart.config.options.scales.x, {
      min: minYear,
      max: maxYear,
    });

    this.chart.update();
  }
}

export { TemperatureVsTimeChart };
