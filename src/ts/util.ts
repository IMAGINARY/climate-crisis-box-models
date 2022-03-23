import { BoxModelExt, BoxModelElementKey } from './box-model-definition';
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
  createTemperatureCelsiusExtractor,
  createYearExtractor,
};
