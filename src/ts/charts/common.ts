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
  elements: {
    line: {
      borderColor: ['#ED1C24', '#ED1C2444'],
      borderCapStyle: 'round',
      borderWidth: 4,
      borderJoinStyle: 'bevel',
    },
    point: {
      backgroundColor: 'transparent',
      borderColor: '#ED1C24',
      borderWidth: 2,
      radius: (ctx) =>
        ctx.datasetIndex === 0 && ctx.dataIndex === ctx.dataset.data.length - 1
          ? 5
          : 0,
    },
  },
  datasets: {
    scatter: {
      clip: {
        left: 0,
        top: false as unknown as number, // this options also accepts booleans, but the type definition is not correct
        right: false as unknown as number, // this options also accepts booleans, but the type definition is not correct
        bottom: 0,
      },
    },
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
