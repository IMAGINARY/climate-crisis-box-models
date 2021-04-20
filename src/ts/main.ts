import { Chart, ChartTypeRegistry, ScaleOptions } from 'chart.js';

import { BoxModel } from '@imaginary-maths/box-model';
import * as m from './models/earth-energy-balance-with-ice-loop';

const numRecords = 3000;

const chartData = {
  labels: Array(numRecords)
    .fill(null)
    .map((_, i) => -(numRecords - i - 1)),
  datasets: [
    {
      label: 'Planet heat content',
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: Array(numRecords).fill(undefined),
      cubicInterpolationMode: 'monotone',
    },
  ],
};
const chartConfig = {
  type: 'line' as keyof ChartTypeRegistry,
  data: chartData,
  options: {
    radius: 0,
    scales: {
      y: {
        min: 0.95e12,
        max: 1.2e12,
      },
    },
  },
};

const elem = document.getElementById('chart') as HTMLCanvasElement;
const planetHeatContentChart = new Chart(elem, chartConfig);
const planetHeadContentIdx = m.stocks.findIndex(
  ({ id }) => id === 'planet heat content'
);

const boxModel = new BoxModel(m);

const initialStocks = m.stocks.map(({ initialValue }) => initialValue);
const initialRecord = boxModel.evaluateGraph(initialStocks, 0);
let lastRecord = initialRecord;
let t = 0;

function addRecords(num = 1) {
  for (let i = 0; i < num; i += 1) {
    const { stocks, flows } = lastRecord;
    lastRecord = boxModel.stepExt(stocks, flows, t * m.stepSize, m.stepSize);
    t += 1;
    chartData.datasets[0].data.shift();
    chartData.datasets[0].data.push(lastRecord.stocks[planetHeadContentIdx]);
  }
  planetHeatContentChart.update('resize');
}

let requestAnimationFrameId = 0;

function animate() {
  addRecords(20);
  cancelAnimationFrame(requestAnimationFrameId);
  requestAnimationFrameId = requestAnimationFrame(animate);
}

function addSlider(parent, constant) {
  const container = document.createElement('div');

  const titleSpan = document.createElement('span');
  titleSpan.innerText = constant.id;
  container.appendChild(titleSpan);

  const slider = document.createElement('input') as HTMLInputElement;
  slider.type = 'range';
  slider.min = `${constant.value * 0.75}`;
  slider.max = `${constant.value * 1.25}`;
  slider.value = `${constant.value}`;
  container.append(slider);

  const valueSpan = document.createElement('span');
  valueSpan.innerText = slider.value;
  container.append(valueSpan);

  slider.addEventListener('input', () => {
    const idx = m.constants.findIndex((c) => c.id === constant.id);
    m.constants[idx].value = Number.parseFloat(slider.value);
    valueSpan.innerText = slider.value;
  });

  parent.appendChild(container);
}

const sliderContainerElem = document.getElementById('slider-container');
m.constants.forEach((c) => addSlider(sliderContainerElem, c));

const startButton = document.getElementById('startButton') as HTMLButtonElement;
const stopButton = document.getElementById('stopButton') as HTMLButtonElement;

startButton.addEventListener('click', () => animate());

stopButton.addEventListener('click', () =>
  cancelAnimationFrame(requestAnimationFrameId)
);
