import {
  Flow,
  Variable,
  StockWithInitialValue,
  ParameterWithRange,
  LookupFunction,
  BoxModelExt,
} from '../box-model-definition';
import { SECONDS_PER_YEAR } from '../constants';

const stocks: StockWithInitialValue[] = [
  {
    id: 'planet heat content',
    in: ['sun radiation'],
    out: ['reflected sun radiation', 'earth infrared radiation'],
    initialValue: 1e12,
  },
];

const flows: Flow[] = [
  {
    id: 'sun radiation',
    formula: ({ p }: { p: LookupFunction }) => p('solar emissivity') / 4,
  },
  {
    id: 'reflected sun radiation',
    formula: ({ p, v }: { p: LookupFunction; v: LookupFunction }) =>
      (p('solar emissivity') * v('albedo')) / 4,
  },
  {
    id: 'earth infrared radiation',
    formula: ({ v }: { v: LookupFunction }) => 5.67e-8 * v('temperature') ** 4,
  },
];

const variables: Variable[] = [
  {
    id: 'temperature',
    formula: ({ s }: { s: LookupFunction }) =>
      s('planet heat content') * 2.38e-10,
  },
  {
    id: 'albedo',
    formula: ({ v }: { v: LookupFunction }) =>
      Math.max(0.15, Math.min(0.65, 2.8 - 0.01 * v('temperature'))),
  },
];

const parameters: ParameterWithRange[] = [
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
