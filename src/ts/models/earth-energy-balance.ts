import {
  FlowWithRange,
  VariableWithRange,
  StockWithInitialValueAndRange,
  ParameterWithRange,
  LookupFunction,
  BoxModelExt,
} from '../box-model-definition';
import { SECONDS_PER_YEAR } from '../constants';

const stocks: StockWithInitialValueAndRange[] = [
  {
    id: 'planet heat content',
    in: ['sun radiation'],
    out: ['reflected sun radiation', 'earth infrared radiation'],
    initialValue: 1e12,
    min: 0,
    max: 2 * 1e12,
  },
];

const flows: FlowWithRange[] = [
  {
    id: 'sun radiation',
    formula: ({ p }: { p: LookupFunction }) => p('solar emissivity') / 4,
    min: 0,
    max: 1,
  },
  {
    id: 'reflected sun radiation',
    formula: ({ p }: { p: LookupFunction }) =>
      (p('solar emissivity') * p('albedo')) / 4,
    min: 0,
    max: 1,
  },
  {
    id: 'earth infrared radiation',
    formula: ({ v }: { v: LookupFunction }) => 5.67e-8 * v('temperature') ** 4,
    min: 0,
    max: 1,
  },
];

const variables: VariableWithRange[] = [
  {
    id: 'temperature',
    formula: ({ s }: { s: LookupFunction }): number =>
      s('planet heat content') * 2.38e-10,
    min: 0,
    max: 1,
  },
];

const parameters: ParameterWithRange[] = [
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
