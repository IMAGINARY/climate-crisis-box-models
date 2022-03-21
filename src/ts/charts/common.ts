import { CartesianScaleOptions, ChartTypeRegistry } from 'chart.js';
import { formatCelsiusTick, formatIrradianceTick } from '../util';

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

const config = {
  type: 'scatter' as keyof ChartTypeRegistry,
  options: {
    responsive: false,
    showLine: true,
    tension: 0,
    parsing: false,
    normalized: true,
    animation: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        type: 'linear',
        grid: gridConfig,
        title: {
          display: true,
          font: { family: 'Share Tech Mono', color: 'black' },
        },
        ticks: {
          callback: formatIrradianceTick,
          font: { family: 'Share Tech Mono', color: 'black' },
          stepSize: Number.POSITIVE_INFINITY,
        },
      },
      y: {
        type: 'linear',
        title: {
          text: 'Temperature',
          display: true,
          font: { family: 'Share Tech Mono', color: 'black' },
        },
        grid: gridConfig,
        ticks: {
          callback: formatCelsiusTick,
          font: { family: 'Share Tech Mono', color: 'black' },
          stepSize: Number.POSITIVE_INFINITY,
        },
      },
    },
  },
};

export { config };
