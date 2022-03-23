import { merge } from 'lodash';
import ChartJs from 'chart.js/auto';
import { ChartConfiguration } from 'chart.js';

import { Chart } from '../chart';
import { SimulationResult } from '../simulation';
import { formatYearTick } from '../util';
import * as common from './common';

export type TemperatureVsTimeChartOptions = {
  numYears: number;
  minTemp: number;
  maxTemp: number;
  toTemperatureCelsius: (result: SimulationResult) => number;
  toYear: (result: SimulationResult) => number;
};

type TMyDataPoint = {
  x: number;
  y: number;
};

type TMyChartType = ChartJs<'scatter', TMyDataPoint[]>;
type TMyChartConfiguration = ChartConfiguration<'scatter', TMyDataPoint[]>;
type TMyChartOptions = TMyChartConfiguration['options'];
type TMyChartData = TMyChartConfiguration['data'];
export default class TemperatureVsTimeChart implements Chart {
  protected readonly chart: TMyChartType;

  protected options: TemperatureVsTimeChartOptions;

  constructor(
    canvas: HTMLCanvasElement,
    options: TemperatureVsTimeChartOptions
  ) {
    this.options = options;

    const chartData: TMyChartData = {
      datasets: [
        {
          label: 'Temperature',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: [] as TMyDataPoint[],
          borderJoinStyle: 'bevel',
          pointRadius: (ctx) =>
            ctx.dataIndex === ctx.dataset.data.length - 1 ? 5 : 0,
          clip: Number.MAX_SAFE_INTEGER,
        },
      ],
    };

    const { minTemp, maxTemp } = this.options;
    const additionalChartOptions: TMyChartOptions = {
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
          min: minTemp,
          max: maxTemp,
        },
      },
    };
    const chartOptions: TMyChartOptions = merge(
      {} as TMyChartOptions,
      common.scatterChartOptions,
      additionalChartOptions
    );

    const chartConfig: TMyChartConfiguration = {
      type: 'scatter',
      data: chartData,
      options: chartOptions,
    };

    this.chart = new ChartJs<'scatter', TMyDataPoint[]>(canvas, chartConfig);
  }

  setYearRange(min: number, max: number) {
    merge(this.chart.config, {
      options: { scales: { x: { min, max } } },
    });
  }

  reset() {
    const { data } = this.chart.data.datasets[0];
    data.splice(0, data.length);
    this.setYearRange(-this.options.numYears, -1);
    this.update([]);
  }

  update(newResults: SimulationResult[]) {
    const { toTemperatureCelsius, toYear } = this.options;
    const createDataPoint = (r: SimulationResult) => ({
      x: toYear(r),
      y: toTemperatureCelsius(r),
    });

    const data = this.chart.data.datasets?.[0]?.data;

    if (data) {
      common.updateDataWithTrace<TMyDataPoint>(
        newResults,
        data,
        createDataPoint,
        (dataPoint) => dataPoint.x,
        this.options.numYears
      );

      const lastDataPoint: TMyDataPoint = data?.[data.length - 1];
      if (lastDataPoint) {
        this.setYearRange(
          lastDataPoint.x - this.options.numYears,
          lastDataPoint.x
        );
      }

      this.chart.update();
    }
  }
}

export { TemperatureVsTimeChart };
