import { ChartTypeRegistry } from 'chart.js';
import ChartJs from 'chart.js/auto';
import { first, last, merge } from 'lodash';

import { Chart } from '../chart';
import { gridConfig, filterNonBoundaryTicks } from './common';
import { SimulationResult } from '../simulation';
import { formatCelsiusTick, formatYearTick } from '../util';
import * as common from './common';

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
    const data: { x: number; y: number }[] = [];

    const chartData = {
      datasets: [
        {
          label: 'Temperature',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          pointRadius: 0,
          data,
          borderJoinStyle: 'bevel',
        },
        {
          label: 'Last datapoint',
          data: [{ x: null, y: null }],
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(75, 192, 192)',
          pointRadius: 5,
          showLine: false,
          clip: false,
        },
      ],
    };

    const chartConfig = merge({}, common.config, {
      data: chartData,
      options: {
        scales: {
          x: {
            title: { text: 'Time' },
            min: -this.options.numYears,
            max: -1,
            ticks: {
              callback: formatYearTick,
            },
          },
          y: {
            min: this.options.minTemp,
            max: this.options.maxTemp,
          },
        },
      },
    });

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

    const data0 = this.chart.data.datasets[0].data;
    const { numYears } = this.options;
    const newDataPoints = newResults.map(createDataPoint);
    const { x: maxYear } = last(newDataPoints) ?? last(data0) ?? { x: -1 };
    const minYear = maxYear - numYears + 1;

    data0.push(...newDataPoints);
    const idx = data0.findIndex(({ x }) => x >= minYear);
    data0.splice(0, idx);

    Object.assign(this.chart.config.options.scales.x, {
      min: minYear,
      max: maxYear,
    });

    const data1 = this.chart.config.data.datasets[1].data;
    data1[0] =
      data0.length > 0 ? data0[data0.length - 1] : { x: null, y: null };

    this.chart.update();
  }
}

export { TemperatureVsTimeChart };
