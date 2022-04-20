import cloneDeep from 'lodash/cloneDeep';
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
    max: 1,
  },
];

const flows: FlowWithRange[] = [
  {
    id: 'sun radiation',
    formula: ({ p }: { p: LookupFunction }) => p('solar emissivity') / 4,
    min: 0,
    max: 355,
  },
  {
    id: 'reflected sun radiation',
    formula: ({ p, v }: { p: LookupFunction; v: LookupFunction }) =>
      (p('solar emissivity') * v('albedo')) / 4,
    min: 0,
    max: 355,
  },
  {
    id: 'earth infrared radiation',
    formula: ({ v }: { v: LookupFunction }) => 5.67e-8 * v('temperature') ** 4,
    min: 0,
    max: 355,
  },
];

const variables: VariableWithRange[] = [
  {
    id: 'temperature',
    formula: ({ s }: { s: LookupFunction }) =>
      s('planet heat content') * 2.38e-10,
    min: 273.15 - 65.7,
    max: 273.15 - 3.1,
  },
  {
    id: 'albedo',
    formula: ({ v }: { v: LookupFunction }) =>
      Math.max(0.15, Math.min(0.65, 2.8 - 0.01 * v('temperature'))),
    min: 0,
    max: 1,
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

const divisor = 8;
const subSteps = 9;
const stepSize = ((subSteps + 1) * SECONDS_PER_YEAR) / divisor;
const yearsPerSecond = 1000 / divisor;
const stepsPerSecond = Math.round(
  (yearsPerSecond * SECONDS_PER_YEAR) / stepSize
);
const numSteps = 1000;

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

function createModel(): BoxModelExt {
  return cloneDeep(model);
}

export default createModel;
