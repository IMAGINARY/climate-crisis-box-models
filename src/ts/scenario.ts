import {
  BoxModelExt,
  ParameterWithRange,
  StockWithInitialValue,
} from './box-model-definition';
import BoxModelEngine from '@imaginary-maths/box-model/dist/box-model';

export interface ScenarioView {
  update(): void;
  tweenIn(): Promise<void>;
  tweenOut(): Promise<void>;
  animate(on: boolean): void;
}

export interface ScenarioController {
  start(): Promise<void>;
  stop(): Promise<void>;

  /***
   * Set the relative value of the first parameter of the model.
   * @param t A number in [0,1] to interpolate between the model parameter's minimum and maximum.
   */
  setParameter(t: number);
  reset(): void;
}
