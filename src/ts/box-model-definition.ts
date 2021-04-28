import cloneDeep from 'lodash/cloneDeep';

import { Stock, Parameter, BoxModel } from './box-model';

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
  numSteps: number;
}

export interface ParameterWithRangeAndInitialValue extends ParameterWithRange {
  readonly initialValue: number;
}

export interface BoxModelForScenario extends BoxModelExt {
  stocks: StockWithInitialValue[];
  parameters: ParameterWithRangeAndInitialValue[];
  [key: string]: any;
}

export function convertToBoxModelForScenario(
  m: BoxModelExt
): BoxModelForScenario {
  const result = cloneDeep(m);
  result.parameters.map(
    (p: ParameterWithRange): ParameterWithRangeAndInitialValue => ({
      ...p,
      initialValue: p.value,
    })
  );
  return result;
}
