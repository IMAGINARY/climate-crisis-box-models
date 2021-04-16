import { Chart, ChartTypeRegistry, ScaleOptions } from 'chart.js';
import { euler, rk4 } from './ode-solver';

import * as m from './models/earth-energy-balance-with-ice-loop';

const duplicateIds = []
  .concat(m.stocks, m.variables, m.constants, m.flows)
  .map((item) => item.id)
  .reduce((acc, cur, curIdx, arr) => {
    if (arr.lastIndexOf(cur) !== curIdx) {
      arr.push(cur);
    }
    return acc;
  }, []);
if (duplicateIds.length > 0) {
  throw Error(`Ids must be unique: ${duplicateIds[0]}`);
}

function createIdToIdxMap(arr: Array<{ id: string }>) {
  const map = {};
  arr.forEach(({ id }, i) => (map[id] = i));
  return map;
}

const idToIdx = {
  ...createIdToIdxMap(m.stocks),
  ...createIdToIdxMap(m.variables),
  ...createIdToIdxMap(m.constants),
  ...createIdToIdxMap(m.flows),
};

function evaluateVariables(stockData, constantData) {
  const variableData = new Array(m.variables.length).fill(null);

  function s(id) {
    return stockData[idToIdx[id]];
  }

  function c(id) {
    return constantData[idToIdx[id]];
  }

  function v(id) {
    const idx = idToIdx[id];
    if (variableData[idx] === null) {
      variableData[idx] = m.variables[idx].equation(s, v, c);
    }
    return variableData[idx];
  }

  return m.variables.map((variable) => variable.equation(s, v, c));
}

function evaluateFlows(stockData, variableData, constantData) {
  function s(id) {
    return stockData[idToIdx[id]];
  }

  function v(id) {
    return variableData[idToIdx[id]];
  }

  function c(id) {
    return constantData[idToIdx[id]];
  }

  const flowData = new Array(m.flows.length).fill(null);

  function f(id) {
    const idx = idToIdx[id];
    if (flowData[idx] === null) {
      flowData[idx] = m.flows[idx].equation(s, v, c);
    }
    return flowData[idx];
  }

  return m.flows.map((flow) => flow.equation(s, v, c));
}

function createInitialRecord() {
  const stockData = m.stocks.map((item) => item.value);
  const constantData = m.constants.map((item) => item.value);
  const variableData = evaluateVariables(stockData, constantData);
  const flowData = evaluateFlows(stockData, variableData, constantData);
  return {
    stocks: stockData,
    variables: variableData,
    constants: constantData,
    flows: flowData,
  };
}

function step(currentRecord, stepSize, solver) {
  function derivs(y: number[]): number[] {
    const stockData = y;
    const constantData = m.constants.map((item) => item.value);
    const variableData = evaluateVariables(stockData, constantData);
    const flowData = evaluateFlows(stockData, variableData, constantData);

    const sum = (a: Array<number>) => a.reduce((a, c) => a + c, 0);
    const f = (id: string): number => flowData[idToIdx[id]];
    const addFlows = (flows: Array<string>) => sum(flows.map((id) => f(id)));

    return y.map((_, i) => {
      const inFlow = addFlows(m.stocks[i].in);
      const outFlow = addFlows(m.stocks[i].out);
      return inFlow - outFlow;
    });
  }

  const stockData = solver(currentRecord.stocks, stepSize, derivs);
  const constantData = m.constants.map((item) => item.value);
  const variableData = evaluateVariables(stockData, constantData);
  const flowData = evaluateFlows(stockData, variableData, constantData);

  return {
    stocks: stockData,
    variables: variableData,
    constants: constantData,
    flows: flowData,
  };
}

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

const initialRecord = createInitialRecord();
let lastRecord = initialRecord;
let t = 0;
console.log(initialRecord);

function addRecords(num = 1) {
  for (let i = 0; i < num; i += 1) {
    lastRecord = step(lastRecord, m.stepSize, rk4);
    t += 1;
    chartData.datasets[0].data.shift();
    chartData.datasets[0].data.push(lastRecord.stocks[planetHeadContentIdx]);
    // console.log(lastRecord);
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

  slider.addEventListener('input', (event) => {
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
