import { Stock, Flow, Variable, Constant } from './box-model';

export interface StockWithInitialValue extends Stock {
  initialValue: number;
}

export interface BoxModelDefinition {
  stocks: StockWithInitialValue[];
  flows: Flow[];
  variables: Variable[];
  constants: Constant[];
  stepSize: number;
}
