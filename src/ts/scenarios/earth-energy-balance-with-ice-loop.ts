import { BaseScenarioView, BaseScenarioController } from '../scenarios/base';
import {
  BoxModelExt,
  BoxModelForScenario,
  convertToBoxModelForScenario,
} from '../box-model-definition';

import model from '../models/earth-energy-balance-with-ice-loop';

class EarthEnergyBalanceWithIceLoopView extends BaseScenarioView {
  constructor(elem: HTMLDivElement, model: BoxModelForScenario) {
    super(elem, model);
  }

  update() {
    throw Error('Not implemented');
  }
}

function createBaseScenarioControllerParams(
  elem: HTMLDivElement,
  model: BoxModelExt
): [BoxModelForScenario, BaseScenarioView] {
  const modelForScenario = convertToBoxModelForScenario(model);
  return [
    modelForScenario,
    new EarthEnergyBalanceWithIceLoopView(elem, modelForScenario),
  ];
}

class EarthEnergyBalanceWithIceLoopScenarioController extends BaseScenarioController {
  constructor(elem) {
    super(...createBaseScenarioControllerParams(elem, model));
  }
}
