import { Options } from './types';

const defaultOptions: Options = {
  initialScenario: 'first',
  autoPlay: true,
  scenarioCycleDirection: 'forward',
  prevScenarioKey: 'ArrowLeft',
  nextScenarioKey: 'ArrowRight',
  cycleScenarioKey: 'c',
  increaseParameterKey: 'ArrowUp',
  decreaseParameterKey: 'ArrowDown',
  mathModeKey: 'm',
  wheelDivisor: 1.0,
  wheelInvert: false,
  wheelAxis: 'y',
};

export default defaultOptions;
