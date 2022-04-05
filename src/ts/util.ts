import SvgJs from '@svgdotjs/svg.js';
import assert from 'assert';

import {
  BoxModelExt,
  BoxModelElementKey,
  BoxModelForScenario,
} from './box-model-definition';
import { SimulationResult } from './simulation';
import { SECONDS_PER_YEAR } from './constants';

async function loadSvg(url: string | URL): Promise<XMLDocument> {
  const stringUrl = `${url.toString()}`;
  const response = await fetch(stringUrl);
  if (response.ok) {
    const text = await response.text();
    const parser = new DOMParser();
    const svg = parser.parseFromString(text, 'image/svg+xml');
    return svg;
  }
  throw new Error(
    `Unable to fetch ${stringUrl}: ${response.statusText} ${response.status}`
  );
}

type Extractor = (result: SimulationResult) => number;

function createExtractor(model: BoxModelExt, key: 't'): Extractor;
function createExtractor(
  model: BoxModelExt,
  key: BoxModelElementKey,
  id: string
): Extractor;
function createExtractor(
  model: BoxModelExt,
  key: 't' | BoxModelElementKey,
  id?: string
): Extractor {
  if (key === 't') {
    return (result) => {
      const { record } = result;
      return record.t;
    };
  }
  const idx = model[key].findIndex(({ id: idInModel }) => id === idInModel);
  return (result) => {
    const { record } = result;
    return record[key][idx];
  };
}

function createRelativeExtractor(
  model: BoxModelExt,
  key: BoxModelElementKey,
  id?: string
): Extractor {
  const idx = model[key].findIndex(({ id: idInModel }) => id === idInModel);
  return (result) => {
    const { min, max } = model[key][idx];
    const { record } = result;
    return (record[key][idx] - min) / (max - min);
  };
}

function kelvinToCelsius(kelvin: number) {
  return kelvin - 273.15;
}

function createTemperatureCelsiusExtractor(
  model: BoxModelExt,
  key: BoxModelElementKey,
  id: string
): Extractor {
  const kelvinExtractor = createExtractor(model, key, id);
  return (result) => kelvinToCelsius(kelvinExtractor(result));
}

const celsiusNumberFormatter = new Intl.NumberFormat('de', {
  maximumFractionDigits: 1,
});
function formatCelsius(celsius: number | string) {
  return `${
    typeof celsius === 'string'
      ? celsius
      : celsiusNumberFormatter.format(celsius)
  }°C`;
}

function formatCelsiusTick(celsius: number | string) {
  return typeof celsius !== 'undefined' ? formatCelsius(celsius) : undefined;
}

function secondsToYears(seconds: number) {
  return Math.round(seconds / SECONDS_PER_YEAR);
}

function createYearExtractor(model: BoxModelExt): Extractor {
  const secondsExtractor = createExtractor(model, 't');
  return (result) => secondsToYears(secondsExtractor(result));
}

function formatYear(year: number | string) {
  return `Year ${year}`;
}

function formatYearTick(year: number | string) {
  return typeof year !== 'undefined' ? formatYear(year) : undefined;
}

function formatIrradiance(irradiance: number | string) {
  return `${
    typeof irradiance === 'string' ? irradiance : irradiance.toFixed(0)
  } W/m²`;
}

function formatIrradianceTick(irradiance: number | string) {
  return typeof irradiance !== 'undefined'
    ? formatIrradiance(irradiance)
    : undefined;
}

type Morpher<T> = (pos: number) => T;

function createSvgMorpher(
  svg: SvgJs.Dom,
  parentSelector: string,
  minSelector: string,
  maxSelector: string,
  inBetweenId: string
): Morpher<void> {
  const parent = svg.findOne(parentSelector) as SvgJs.G;
  const minGroup = svg.findOne(minSelector) as SvgJs.G;
  assert(minGroup !== null, 'minGroup must not be null');

  const maxGroup = svg.findOne(maxSelector) as SvgJs.G;
  assert(maxGroup !== null, 'maxGroup must not be null');

  assert(
    minGroup.children().length === maxGroup.children().length,
    'minGroup and maxGroup must have the same number of children'
  );

  const inBetweenGroup = minGroup.clone();
  inBetweenGroup.attr('id', inBetweenId);
  parent.add(inBetweenGroup);

  minGroup.css({ display: 'none' });
  maxGroup.css({ display: 'none' });

  type ShapeWithArray = SvgJs.Polyline | SvgJs.Polygon | SvgJs.Path;
  const supportedShapeTypes = ['polyline', 'polygon', 'path'];

  const morphers = Array.from(inBetweenGroup.children()).map((_, i) => {
    const shapeAtMin = minGroup.children()[i] as ShapeWithArray;
    const shapeInBetween = inBetweenGroup.children()[i] as ShapeWithArray;
    const shapeAtMax = maxGroup.children()[i] as ShapeWithArray;

    assert(shapeAtMin.type === shapeAtMax.type, 'Shape types must be equal');
    assert(
      supportedShapeTypes.includes(shapeAtMin.type),
      `Shape type must be one of ${supportedShapeTypes.join(', ')}, but is ${
        shapeAtMin.type
      }`
    );

    console.log(shapeAtMin, shapeAtMax);
    assert(
      shapeAtMin.array().length === shapeAtMax.array().length,
      'Shape arrays must have equal length'
    );
    const arrayMorpher = shapeAtMin.array().to(shapeAtMax.array());
    const shapeMorpher = (t: number) => {
      shapeInBetween.plot(arrayMorpher.at(t) as SvgJs.PointArrayAlias);
    };
    return shapeMorpher;
  }) as ((t: number) => void)[];

  const morpher = (t: number) => morphers.forEach((m) => m(t));
  return morpher;
}

interface Updater {
  update(results: SimulationResult[]): void;
  reset(): void;
}

function createSvgMorphUpdater(
  model: BoxModelExt,
  key: BoxModelElementKey,
  id: string,
  svg: SvgJs.Dom,
  parentSelector: string,
  minSelector: string,
  maxSelector: string,
  inBetweenId: string
): Updater {
  const relativeExtractor = createRelativeExtractor(model, key, id);
  const morpher = createSvgMorpher(
    svg,
    parentSelector,
    minSelector,
    maxSelector,
    inBetweenId
  );
  const updater: Updater = new (class implements Updater {
    // eslint-disable-next-line class-methods-use-this
    update(results: SimulationResult[]) {
      if (results.length > 0)
        morpher(relativeExtractor(results[results.length - 1]));
    }

    // eslint-disable-next-line class-methods-use-this
    reset() {
      morpher(0);
    }
  })();
  return updater;
}

export {
  loadSvg,
  kelvinToCelsius,
  secondsToYears,
  formatCelsius,
  formatCelsiusTick,
  formatYear,
  formatYearTick,
  formatIrradiance,
  formatIrradianceTick,
  createExtractor,
  createRelativeExtractor,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  Morpher,
  createSvgMorpher,
  Updater,
  createSvgMorphUpdater,
};
