import { merge } from 'lodash';
import ChartJs from 'chart.js/auto';
import { ChartConfiguration } from 'chart.js';

import { Chart } from '../chart';
import { SimulationResult } from '../simulation';
import * as common from './common';

export type TimeVsYChartOptions = {
  numYears: number;
  minTemp: number;
  maxTemp: number;
  yAxisLabel: () => string;
  timeAxisTitle: () => string;
  timeTickStepSize: number;
  toYUnit: (result: SimulationResult) => number;
  toYear: (result: SimulationResult) => number;
};

type TMyDataPoint = {
  x: number;
  y: number;
};

function createYearTicks(
  minYear: number,
  maxYear: number,
  stepSize: number
): { value: number }[] {
  const ticks: { value: number }[] = [];
  ticks.push({ value: minYear });
  const modulus = minYear % stepSize;
  const offset = modulus < 0 ? stepSize + modulus : modulus;
  for (
    let tickYear = minYear - offset + stepSize;
    tickYear < maxYear;
    tickYear += stepSize
  ) {
    ticks.push({ value: tickYear });
  }
  ticks.push({ value: maxYear });
  return ticks;
}

type TMyChartType = ChartJs<'scatter', TMyDataPoint[]>;
type TMyChartConfiguration = ChartConfiguration<'scatter', TMyDataPoint[]>;
type TMyChartOptions = TMyChartConfiguration['options'];
type TMyChartData = TMyChartConfiguration['data'];
export default class TimeVsYChart implements Chart {
  protected readonly chart: TMyChartType;

  protected options: TimeVsYChartOptions;

  constructor(canvas: HTMLCanvasElement, options: TimeVsYChartOptions) {
    this.options = options;

    const chartData: TMyChartData = {
      datasets: [
        {
          label: 'Temperature',
          data: [] as TMyDataPoint[],
        },
      ],
    };

    const { minTemp, maxTemp } = this.options;
    const additionalChartOptions: TMyChartOptions = {
      scales: {
        x: {
          title: { text: this.options.timeAxisTitle() },
          min: 0,
          max: this.options.numYears,
          afterBuildTicks: (axis) => {
            // eslint-disable-next-line no-param-reassign
            axis.ticks = createYearTicks(
              axis.min,
              axis.max,
              this.options.timeTickStepSize
            );
          },
        },
        y: {
          title: { text: this.options.yAxisLabel() },
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

  reset() {
    const { data } = this.chart.data.datasets[0];
    data.splice(0, data.length);
    this.update([]);
  }

  update(newResults: SimulationResult[]) {
    const { toYUnit, toYear } = this.options;
    const createDataPoint = (r: SimulationResult) => ({
      x: toYear(r),
      y: toYUnit(r),
    });

    const data = this.chart.data.datasets?.[0]?.data;

    if (data) {
      data.push(...newResults.map(createDataPoint));

      this.chart.update();
    }
  }
}

export { TimeVsYChart };
