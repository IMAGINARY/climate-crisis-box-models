import { Stock, BoxModel } from './box-model';

export interface StockWithInitialValue extends Stock {
  initialValue: number;
}

export interface BoxModelExt extends BoxModel {
  stocks: StockWithInitialValue[];
  stepSize: number;
  [key: string]: any;
}
