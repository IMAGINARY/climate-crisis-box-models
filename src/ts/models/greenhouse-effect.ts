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
    id: 'atmosphere',
    in: ['gnd infrared radiation'],
    out: [
      'atm infrared radiation',
      'atm infrared radiation',
      'gnd infrared radiation not absorbed',
    ],
    initialValue: 2.41e10,
    min: 0,
    max: 1,
  },
  {
    id: 'ground',
    in: ['sun radiation', 'atm infrared radiation'],
    out: ['reflected sun radiation', 'gnd infrared radiation'],
    initialValue: 4.445e12,
    min: 0,
    max: 1,
  },
];

const flows: FlowWithRange[] = [
  {
    id: 'sun radiation',
    formula: ({ p }: { p: LookupFunction }) => p('solar emissivity') / 4,
    min: 0,
    max: 341.75,
  },
  {
    id: 'reflected sun radiation',
    formula: ({ p }: { p: LookupFunction }) =>
      (p('solar emissivity') * p('albedo')) / 4,
    min: 0,
    max: 341.75,
  },
  {
    id: 'atm infrared radiation',
    formula: ({ v }: { v: LookupFunction }) =>
      v('epsilon') * 5.67e-8 * v('atm temperature') ** 4,
    min: 139,
    max: 170,
  },
  {
    id: 'gnd infrared radiation',
    formula: ({ v }: { v: LookupFunction }) =>
      5.67e-8 * v('gnd temperature') ** 4,
    min: 378,
    max: 406,
  },
  {
    id: 'gnd infrared radiation not absorbed',
    formula: ({ v }: { v: LookupFunction }) =>
      (1 - v('epsilon')) * 5.67e-8 * v('gnd temperature') ** 4,
    min: 62,
    max: 100,
  },
];

const epsilonFactor = 0.04 / Math.log(2);
const epsilonOffset = 0.421;

const variables: VariableWithRange[] = [
  {
    id: 'atm temperature',
    formula: ({ s }: { s: LookupFunction }) => s('atmosphere') / 1e8,
    min: 0,
    max: 1,
  },
  {
    id: 'gnd temperature',
    formula: ({ s }: { s: LookupFunction }) => s('ground') / 1.55e10,
    min: 273.15 + 12.8,
    max: 273.15 + 15.51,
  },
  {
    id: 'epsilon',
    formula: ({ p }: { p: LookupFunction }) =>
      epsilonFactor * Math.log(p('co2')) + epsilonOffset,
    min: 0,
    max: 1,
  },
];

const parameters: ParameterWithRange[] = [
  {
    id: 'co2',
    min: 230,
    max: 1350,
    value: 379.45,
  },
  {
    id: 'solar emissivity',
    min: 1000,
    max: 2000,
    value: 1366,
  },
  {
    id: 'albedo',
    min: 0.0,
    max: 1.0,
    value: 0.3,
  },
];

const divisor = 10;
const subSteps = 9;
const stepSize = ((subSteps + 1) * SECONDS_PER_YEAR) / divisor;
const yearsPerSecond = 250 / divisor;
const stepsPerSecond = Math.round(
  (yearsPerSecond * SECONDS_PER_YEAR) / stepSize
);
const numSteps = 250;

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
export { epsilonFactor, epsilonOffset };
