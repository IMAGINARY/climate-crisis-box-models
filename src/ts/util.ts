import { BoxModelExt } from './box-model-definition';
import model from './models/greenhouse-effect';
import { SimulationResult } from './simulation';
import { SECONDS_PER_YEAR } from './constants';

async function loadSvg(url: string | URL): Promise<XMLDocument> {
  const stringUrl = `${url}`;
  const response = await fetch(stringUrl);
  if (response.ok) {
    const text = await response.text();
    const parser = new DOMParser();
    const svg = parser.parseFromString(text, 'image/svg+xml');
    return svg;
  } else {
    throw new Error(
      `Unable to fetch ${stringUrl}: ${response.statusText} ${response.status}`
    );
  }
}

type Extractor = (result: SimulationResult) => number;

type ModelKeyForObjWithId = 'stocks' | 'flows' | 'variables' | 'parameters';

function createExtractor(model: BoxModelExt, key: 't'): Extractor;
function createExtractor(
  model: BoxModelExt,
  key: ModelKeyForObjWithId,
  id: string
): Extractor;
function createExtractor(
  model: BoxModelExt,
  key: 't' | ModelKeyForObjWithId,
  id?: string
): Extractor {
  if (key === 't') {
    return (result) => {
      const [, record] = result;
      return record.t;
    };
  } else {
    const idx = model[key].findIndex(({ id: idInModel }) => id === idInModel);
    return (result) => {
      const [, record] = result;
      return record[key][idx];
    };
  }
}

function kelvinToCelsius(kelvin: number) {
  return kelvin - 273.15;
}

function createTemperatureCelsiusExtractor(
  model: BoxModelExt,
  key: ModelKeyForObjWithId,
  id: string
): Extractor {
  const kelvinExtractor = createExtractor(model, key, id);
  return (result) => kelvinToCelsius(kelvinExtractor(result));
}

const celsiusNumberFormatter = new Intl.NumberFormat('de', {
  maximumFractionDigits: 1,
});
function formatCelsius(celsius) {
  return `${celsiusNumberFormatter.format(celsius)}°C`;
}

function secondsToYears(seconds) {
  return Math.round(seconds / SECONDS_PER_YEAR);
}

function createYearExtractor(model: BoxModelExt) {
  const secondsExtractor = createExtractor(model, 't');
  return (result) => secondsToYears(secondsExtractor(result));
}

export {
  loadSvg,
  kelvinToCelsius,
  secondsToYears,
  formatCelsius,
  createExtractor,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
};
