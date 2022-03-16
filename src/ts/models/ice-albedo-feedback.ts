import { BoxModelExt } from '../box-model-definition';
import { SECONDS_PER_YEAR } from '../constants';

const stocks = [
  {
    id: 'planet heat content',
    in: ['sun radiation'],
    out: ['reflected sun radiation', 'earth infrared radiation'],
    initialValue: 1e12,
  },
];

const flows = [
  {
    id: 'sun radiation',
    formula: (s, f, v, p, t) => p('solar emissivity') / 4,
  },
  {
    id: 'reflected sun radiation',
    formula: (s, f, v, p, t) => (p('solar emissivity') * v('albedo')) / 4,
  },
  {
    id: 'earth infrared radiation',
    formula: (s, f, v, p, t) => 5.67e-8 * Math.pow(v('temperature'), 4),
  },
];

const variables = [
  {
    id: 'temperature',
    formula: (s, f, v, p, t) => s('planet heat content') * 2.38e-10,
  },
  {
    id: 'albedo',
    formula: (s, f, v, p, t) =>
      Math.max(0.15, Math.min(0.65, 2.8 - 0.01 * v('temperature'))),
  },
];

const parameters = [
  {
    id: 'solar emissivity',
    min: 1200,
    max: 1420,
    value: 1367,
  },
];

const subSteps = 9;
const stepSize = (subSteps + 1) * SECONDS_PER_YEAR;
const yearsPerSecond = 1000;
const stepsPerSecond = Math.round(
  (yearsPerSecond * SECONDS_PER_YEAR) / stepSize
);
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
