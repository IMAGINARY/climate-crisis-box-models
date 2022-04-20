import { Chart, ChartConfiguration, ScaleOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';
import { formatCelsiusFrac, formatCelsiusTick } from '../util';
import { SimulationResult } from '../simulation';

Chart.register(ChartDataLabels);
Chart.register(annotationPlugin);

const colors = ['#ED1C24', '#ED1C2444'];
const dataLabelColor = '#b2151b';

const xGridConfig = {
  display: true,
  drawBorder: true,
  drawOnChartArea: false,
  drawTicks: true,
  borderColor: 'black',
  borderWidth: 2,
  tickColor: 'black',
  tickWidth: 2,
};

const yGridConfig = { ...xGridConfig, display: false };

const xScaleConfig: ScaleOptions = {
  type: 'linear',
  grid: xGridConfig,
  title: {
    display: true,
    font: { family: 'RobotoCondensed-Regular' },
    color: 'black',
  },
  ticks: {
    display: false,
    font: { family: 'RobotoCondensed-Regular' },
    color: 'black',
    stepSize: Number.POSITIVE_INFINITY,
  },
};

const yScaleConfig: ScaleOptions = {
  type: 'linear',
  title: {
    display: true,
    font: { family: 'RobotoCondensed-Regular' },
    color: 'black',
  },
  grid: yGridConfig,
  ticks: {
    display: false,
    callback: formatCelsiusTick,
    font: { family: 'RobotoCondensed-Regular' },
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
    datalabels: {
      color: dataLabelColor,
      labels: {
        value: {
          display: (ctx) =>
            ctx.datasetIndex === 0 &&
            ctx.dataIndex === ctx.dataset.data.length - 1,
          formatter: ({ y }: { y: number }) => formatCelsiusFrac(y),
          anchor: 'end',
          align: 'end',
          backgroundColor: '#b8e4f3aa',
          borderRadius: 4,
          padding: 3,
        },
      },
    },
  },
  elements: {
    line: {
      borderColor: (ctx) => (ctx.datasetIndex === 0 ? colors[0] : colors[1]),
      borderCapStyle: 'round',
      borderWidth: 4,
      borderJoinStyle: 'bevel',
    },
    point: {
      backgroundColor: 'transparent',
      borderColor: colors[0],
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
  layout: { padding: { top: 40, right: 40 } },
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
