import { merge } from 'lodash';
import ChartJs from 'chart.js/auto';
import { ChartConfiguration } from 'chart.js';

import { Chart } from '../chart';
import { SimulationResult } from '../simulation';
import * as common from './common';

type TMyDataPoint = {
  x: number;
  y: number;
};

type TMyChartType = ChartJs<'scatter', TMyDataPoint[]>;
type TMyChartConfiguration = ChartConfiguration<'scatter', TMyDataPoint[]>;
type TMyChartOptions = TMyChartConfiguration['options'];
type TMyChartData = TMyChartConfiguration['data'];

export type RealtimeVsYChartOptions = {
  numYears: number;
  minY: number;
  maxY: number;
  yAxisLabel: () => string;
  yDataFormatter: ({ y }: { y: number }) => string;
  timeAxisTitle: () => string;
  timeTickStepSize: number;
  toYUnit: (result: SimulationResult) => number;
  toYear: (result: SimulationResult) => number;
  bgData: TMyDataPoint[][];
  rawChartOptions?: TMyChartOptions;
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

export default class RealtimeVsYChart implements Chart {
  protected readonly chart: TMyChartType;

  protected options: RealtimeVsYChartOptions;

  constructor(canvas: HTMLCanvasElement, options: RealtimeVsYChartOptions) {
    this.options = options;

    const chartData: TMyChartData = {
      datasets: [
        {
          label: 'Simulation',
          data: [] as TMyDataPoint[],
        },
      ],
    };

    const { minY, maxY, yDataFormatter } = this.options;
    const additionalChartOptions: TMyChartOptions = {
      plugins: {
        datalabels: {
          labels: {
            value: {
              formatter: yDataFormatter,
            },
          },
        },
      },
      scales: {
        x: {
          title: { text: this.options.timeAxisTitle() },
          min: -this.options.numYears,
          max: -1,
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
          min: minY,
          max: maxY,
        },
      },
    };
    const chartOptions: TMyChartOptions = merge(
      {} as TMyChartOptions,
      common.scatterChartOptions,
      additionalChartOptions,
      options.rawChartOptions ?? {}
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
    const { toYUnit, toYear } = this.options;
    const createDataPoint = (r: SimulationResult) => ({
      x: toYear(r),
      y: toYUnit(r),
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
    }
    this.chart.update();
  }
}

export { RealtimeVsYChart };
