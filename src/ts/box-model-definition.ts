import cloneDeep from 'lodash/cloneDeep';

import { Stock, Parameter, BoxModel } from '@imaginary-maths/box-model';

export interface StockWithInitialValue extends Stock {
  initialValue: number;
}

export interface ParameterWithRange extends Parameter {
  min: number;
  max: number;
}

export interface BoxModelExt extends BoxModel {
  stocks: StockWithInitialValue[];
  parameters: ParameterWithRange[];
  stepSize: number;
  stepsPerSecond: number;
  subSteps: number;
  numSteps: number;
}

export interface ParameterWithRangeAndInitialValue extends ParameterWithRange {
  readonly initialValue: number;
}

export interface BoxModelForScenario extends BoxModelExt {
  stocks: StockWithInitialValue[];
  parameters: ParameterWithRangeAndInitialValue[];
  [key: string]: unknown;
}

function addInitialValueToParameter(
  p: ParameterWithRange
): ParameterWithRangeAndInitialValue {
  return {
    ...p,
    initialValue: p.value,
  };
}

export function convertToBoxModelForScenario(
  m: BoxModelExt
): BoxModelForScenario {
  const mDeepClone: BoxModelExt = cloneDeep<BoxModelExt>(m);
  const result: BoxModelForScenario = {
    ...mDeepClone,
    parameters: mDeepClone.parameters.map(addInitialValueToParameter),
  };
  return result;
}

export * from '@imaginary-maths/box-model';
