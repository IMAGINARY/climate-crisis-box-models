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
    formula: (s, f, v, p, t) => (p('solar emissivity') * p('albedo')) / 4,
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
];

const parameters = [
  {
    id: 'albedo',
    min: 0,
    max: 1,
    value: 0.3,
  },
  {
    id: 'solar emissivity',
    min: 1000,
    max: 2000,
    value: 1367,
  },
];

const subSteps = 1;
const stepSize = (subSteps + 1) * SECONDS_PER_YEAR;
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
