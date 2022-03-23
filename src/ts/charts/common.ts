import { ChartConfiguration, ScaleOptions } from 'chart.js';
import { formatCelsiusTick } from '../util';
import { SimulationResult } from '../simulation';

const gridConfig = {
  display: true,
  drawBorder: true,
  drawOnChartArea: false,
  drawTicks: true,
  borderColor: 'black',
  borderWidth: 2,
  tickColor: 'black',
  tickWidth: 2,
};

const xScaleConfig: ScaleOptions = {
  type: 'linear',
  grid: gridConfig,
  title: {
    display: true,
    font: { family: 'Share Tech Mono' },
    color: 'black',
  },
  ticks: {
    font: { family: 'Share Tech Mono' },
    color: 'black',
    stepSize: Number.POSITIVE_INFINITY,
  },
};

const yScaleConfig: ScaleOptions = {
  type: 'linear',
  title: {
    text: 'Temperature',
    display: true,
    font: { family: 'Share Tech Mono' },
    color: 'black',
  },
  grid: gridConfig,
  ticks: {
    callback: formatCelsiusTick,
    font: { family: 'Share Tech Mono' },
    color: 'black',
    stepSize: Number.POSITIVE_INFINITY,
  },
};

const scatterChartOptions: ChartConfiguration<'scatter'>['options'] = {
  responsive: false,
  showLine: true,
  parsing: false,
  normalized: true,
  animation: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: xScaleConfig,
    y: yScaleConfig,
  },
};

function updateDataWithTrace<TMyDataPoint>(
  newResults: SimulationResult[],
  data: TMyDataPoint[],
  createDataPoint: (result: SimulationResult) => TMyDataPoint,
  propGetter: (dataPoint: TMyDataPoint) => number,
  totalProp: number
): void {
  const newDataPoints = newResults.map(createDataPoint);
  data.push(...newDataPoints);

  if (typeof data[data.length - 1] !== 'undefined') {
    const maxProp = propGetter(data[data.length - 1]);
    const minProp = maxProp - totalProp + 1;

    const idx: number = data.findIndex(
      (o: TMyDataPoint) => propGetter(o) >= minProp
    );
    data.splice(0, idx);
  }
}

// eslint-disable-next-line import/prefer-default-export
export { scatterChartOptions, updateDataWithTrace };
