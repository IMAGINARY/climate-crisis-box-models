export type Options = {
  initialScenario: number | 'first' | 'last' | 'random';
  osc: boolean;
  autoPlay: boolean;
  pauseAfter: number | 'false';
  resetAfter: number | 'false';
  scenarioCycleDirection: 'forward' | 'backward';
  prevScenarioKey: KeyboardEvent['key'];
  nextScenarioKey: KeyboardEvent['key'];
  cycleScenarioKey: KeyboardEvent['key'];
  increaseParameterKey: KeyboardEvent['key'];
  decreaseParameterKey: KeyboardEvent['key'];
  mathModeKey: KeyboardEvent['key'];
  wheelDivisor: number;
  wheelInvert: boolean;
  wheelAxis: 'x' | 'y';
};
