import { BoxModelExt } from '../box-model-definition';
import { SECONDS_PER_YEAR } from '../constants';

const stocks = [
  {
    id: 'atmosphere',
    in: ['gnd infrared radiation'],
    out: [
      'atm infrared radiation',
      'atm infrared radiation',
      'gnd infrared radiation not absorbed',
    ],
    initialValue: 24261360703,
  },
  {
    id: 'ground',
    in: ['sun radiation', 'atm infrared radiation'],
    out: ['reflected sun radiation', 'gnd infrared radiation'],
    initialValue: 4472026329130,
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
    id: 'atm infrared radiation',
    formula: (s, f, v, p, t) =>
      v('epsilon') * 5.67e-8 * Math.pow(v('atm temperature'), 4),
  },
  {
    id: 'gnd infrared radiation',
    formula: (s, f, v, p, t) => 5.67e-8 * Math.pow(v('gnd temperature'), 4),
  },
  {
    id: 'gnd infrared radiation not absorbed',
    formula: (s, f, v, p, t) =>
      (1 - v('epsilon')) * 5.67e-8 * Math.pow(v('gnd temperature'), 4),
  },
];

const variables = [
  {
    id: 'atm temperature',
    formula: (s, f, v, p, t) => s('atmosphere') / 1e8,
  },
  {
    id: 'gnd temperature',
    formula: (s, f, v, p, t) => s('ground') / 1.55e10,
  },
  {
    id: 'epsilon',
    formula: (s, f, v, p, t) => 0.057 * Math.log(1 + p('co2')) + 0.437,
  },
];

const parameters = [
  {
    id: 'co2',
    min: 280,
    max: 4480,
    value: 426,
  },
  {
    id: 'solar emissivity',
    min: 1000,
    max: 2000,
    value: 1367,
  },
  {
    id: 'albedo',
    min: 0.0,
    max: 1.0,
    value: 0.3,
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
