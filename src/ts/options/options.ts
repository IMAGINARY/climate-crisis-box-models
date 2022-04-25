import cloneDeep from 'lodash/cloneDeep';
import difference from 'lodash/difference';

import { Options } from './types';
import defaultOptions from './defaultOptions';
import {
  Parser,
  booleanParser,
  floatParser,
  stringsParser,
  intOrStringsParser,
  keyParser,
} from './optionParsers';

type OptionParsers = {
  [key in keyof Options]: Parser<Options[key]>;
};

const parsers: OptionParsers = {
  initialScenario: intOrStringsParser('first', 'last', 'random') as Parser<
    number | 'first' | 'last' | 'random'
  >,
  osc: booleanParser(),
  autoPlay: booleanParser(),
  pauseAfter: intOrStringsParser('false') as Parser<number | 'false'>,
  resetAfter: intOrStringsParser('false') as Parser<number | 'false'>,
  scenarioCycleDirection: stringsParser('forward', 'backward') as Parser<
    'forward' | 'backward'
  >,
  prevScenarioKey: keyParser(),
  nextScenarioKey: keyParser(),
  cycleScenarioKey: keyParser(),
  increaseParameterKey: keyParser(),
  decreaseParameterKey: keyParser(),
  mathModeKey: keyParser(),
  wheelDivisor: floatParser(),
  wheelInvert: booleanParser(),
  wheelAxis: stringsParser('x', 'y') as Parser<'x' | 'y'>,
};

export function getDefaultOptions(): Options {
  return cloneDeep(defaultOptions);
}

export function getOptions(): Options {
  const searchParams = new URLSearchParams(window.location.search);

  const unknownSearchParamKeys = difference(
    Array.from(searchParams.keys()),
    Object.keys(parsers)
  );
  if (unknownSearchParamKeys.length > 0) {
    console.warn(
      `Unknown search param(s): ${unknownSearchParamKeys.join(', ')}`
    );
  }

  /**
   *   The following conversion is not really type safe. I don't know how to
   *   preserve the type information when iteration an objects properties via
   *   e.g. Object.entries().
   */
  return Object.fromEntries(
    Object.entries(getDefaultOptions()).map(
      ([key, value]: [key: string, value: unknown]) => {
        const parser = parsers[key as keyof Options];
        const searchParam = searchParams.get(key);
        if (searchParam !== null) {
          return [key, parser(searchParam)];
        }
        return [key, value];
      }
    )
  ) as Options;
}
