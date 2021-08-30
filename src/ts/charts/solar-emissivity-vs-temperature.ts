import { ChartTypeRegistry } from 'chart.js';
import ChartJs from 'chart.js/auto';
import { first, last } from 'lodash';

import { Chart } from '../chart';
import { SimulationResult } from '../simulation';
import { formatCelsius } from '../util';

export type SolarEmissivityVsTemperatureChartOptions = {
  numYears: number;
  minTemp: number;
  maxTemp: number;
  minEmissivity: number;
  maxEmissivity: number;
  toSolarEmissivity: (result: SimulationResult) => number;
  toTemperatureCelsius: (result: SimulationResult) => number;
  toYear: (result: SimulationResult) => number;
};

export default class SolarEmissivityVsTemperatureChart implements Chart {
  protected readonly chart: ChartJs;
  protected options: SolarEmissivityVsTemperatureChartOptions;
  protected count: number;

  constructor(
    canvas: HTMLCanvasElement,
    options: SolarEmissivityVsTemperatureChartOptions
  ) {
    this.options = options;
    const chartData = {
      datasets: [
        {
          label: 'Solar emissivity vs. Temperature',
          data: new Array(200).fill({ x: null, y: null }),
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          borderJoinStyle: 'bevel',
          pointRadius: 0,
        },
        {
          label: 'Last datapoint',
          data: [{ x: null, y: null }],
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(75, 192, 192)',
          pointRadius: 5,
          showLine: false,
        },
      ],
    };
    const { minEmissivity: chartXMin, maxEmissivity: chartXMax } = this.options;
    const chartXSize = chartXMax - chartXMin;
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
            min: chartXMin - 0.1 * chartXSize,
            max: chartXMax + 0.1 * chartXSize,
          },
          y: {
            type: 'linear',
            min: -274,
            max: 40,
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
    const data0 = this.chart.data.datasets[0].data;
    data0.splice(0, data0.length);

    const data1 = this.chart.data.datasets[1].data;
    data1[0] = { x: null, y: null };

    this.update([]);
  }

  update(newResults: SimulationResult[]) {
    const { toSolarEmissivity, toTemperatureCelsius, toYear } = this.options;
    const createDataPoint = (r: SimulationResult) => ({
      x: toSolarEmissivity(r),
      y: toTemperatureCelsius(r),
      year: toYear(r),
    });

    const data0 = this.chart.data.datasets[0].data;
    const { numYears } = this.options;
    const newDataPoints = newResults.map(createDataPoint);
    const { year: maxYear } = last(newDataPoints) ??
      last(data0) ?? { year: -1 };
    const minYear = maxYear - numYears + 1;

    data0.push(...newDataPoints);
    const idx = data0.findIndex(({ year }) => year >= minYear);
    data0.splice(0, idx);

    const data1 = this.chart.config.data.datasets[1].data;
    data1[0] =
      data0.length > 0 ? data0[data0.length - 1] : { x: null, y: null };

    this.chart.update();
  }
}

export { SolarEmissivityVsTemperatureChart };
