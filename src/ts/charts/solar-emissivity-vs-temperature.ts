import { merge } from 'lodash';
import ChartJs from 'chart.js/auto';
import { ChartConfiguration } from 'chart.js';

import { Chart } from '../chart';
import { SimulationResult } from '../simulation';
import * as common from './common';
import { formatIrradianceTick } from '../util';

export type SolarEmissivityVsTemperatureChartOptions = {
  numYears: number;
  minTemp: number;
  maxTemp: number;
  minEmissivity: number;
  maxEmissivity: number;
  toSolarEmissivity: (result: SimulationResult) => number;
  toTemperatureCelsius: (result: SimulationResult) => number;
  toYear: (result: SimulationResult) => number;
  hysteresisData: ReadonlyArray<SimulationResult>;
};

type TMyDataPoint = {
  x: number;
  y: number;
  year: number;
};

type TMyChartType = ChartJs<'scatter', TMyDataPoint[]>;
type TMyChartConfiguration = ChartConfiguration<'scatter', TMyDataPoint[]>;
type TMyChartOptions = TMyChartConfiguration['options'];
type TMyChartData = TMyChartConfiguration['data'];

export default class SolarEmissivityVsTemperatureChart implements Chart {
  protected readonly chart: TMyChartType;

  protected options: SolarEmissivityVsTemperatureChartOptions;

  constructor(
    canvas: HTMLCanvasElement,
    options: SolarEmissivityVsTemperatureChartOptions
  ) {
    this.options = options;
    const chartData: TMyChartData = {
      datasets: [
        {
          label: 'Solar emissivity vs. Temperature',
          data: [] as TMyDataPoint[],
        },
        {
          label: 'Hysteresis',
          data: options.hysteresisData.map((r) => ({
            x: options.toSolarEmissivity(r),
            y: options.toTemperatureCelsius(r),
            year: 0,
          })),
        },
      ],
    };
    const { minEmissivity: chartXMin, maxEmissivity: chartXMax } = this.options;
    const { minTemp: chartYMin, maxTemp: chartYMax } = this.options;
    const chartXSize = chartXMax - chartXMin;
    const chartYSize = chartYMax - chartYMin;
    const additionalChartOptions: TMyChartOptions = {
      scales: {
        x: {
          title: { text: 'Solar Emissivity' },
          min: chartXMin - 0.1 * chartXSize,
          max: chartXMax + 0.1 * chartXSize,
          ticks: {
            callback: formatIrradianceTick,
          },
        },
        y: {
          min: chartYMin - 0.1 * chartYSize,
          max: chartYMax + 0.1 * chartYSize,
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
    const data0 = this.chart.data.datasets[0].data;
    data0.splice(0, data0.length);
    this.update([]);
  }

  update(newResults: SimulationResult[]) {
    const { toSolarEmissivity, toTemperatureCelsius, toYear } = this.options;
    const createDataPoint = (r: SimulationResult) => ({
      x: toSolarEmissivity(r),
      y: toTemperatureCelsius(r),
      year: toYear(r),
    });

    common.updateDataWithTrace<TMyDataPoint>(
      newResults,
      this.chart.data.datasets[0].data,
      createDataPoint,
      (dataPoint) => dataPoint.year,
      this.options.numYears
    );

    this.chart.update();
  }
}

export { SolarEmissivityVsTemperatureChart };
