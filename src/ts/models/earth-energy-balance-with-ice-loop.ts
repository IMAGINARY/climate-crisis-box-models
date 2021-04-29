import { BoxModelExt } from '../box-model-definition';

const stocks = [
  {
    id: 'planet heat content',
    in: ['sun radiation'],
    out: ['earth infrared radiation'],
    initialValue: 1e12,
  },
];

const variables = [
  {
    id: 'albedo',
    formula: (s, f, v, c, t) =>
      Math.max(0, Math.min(1, 2.8 - 0.01 * v('temperature'))),
  },
  {
    id: 'ice',
    formula: (s, f, v, c, t) => -323 + 1.5 * v('temperature'),
  },
  {
    id: 'temperature',
    formula: (s, f, v, c, t) => s('planet heat content') / v('heat capacity'),
  },
  {
    id: 'heat capacity',
    formula: (s, f, v, c, t) => c('water depth') * 4.2e6,
  },
];

const parameters = [
  {
    id: 'water depth',
    min: 500,
    max: 1500,
    value: 1000,
  },
  {
    id: 'solar emissivity',
    min: 1000,
    max: 2000,
    value: 1363,
  },
];

const flows = [
  {
    id: 'sun radiation',
    formula: (s, f, v, c, t) => (c('solar emissivity') * (1 - v('albedo'))) / 4,
  },
  {
    id: 'earth infrared radiation',
    formula: (s, f, v, c, t) => 5.67e-8 * Math.pow(v('temperature'), 4),
  },
];

const secondsPerYear = 60 * 60 * 24 * 365.2425;
const subSteps = 1;
const stepSize = (subSteps + 1) * secondsPerYear;
const stepsPerSecond = 60;
const numSteps = 3000;

const model: BoxModelExt = {
  stocks,
  variables,
  parameters,
  flows,
  stepSize,
  stepsPerSecond,
  numSteps,
  subSteps,
};

export default model;
