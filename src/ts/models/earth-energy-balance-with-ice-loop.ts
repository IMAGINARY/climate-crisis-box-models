const stocks = [
  {
    id: 'planet heat content',
    value: 1e12,
    in: ['sun radiation'],
    out: ['earth infrared radiation'],
  },
];

const variables = [
  {
    id: 'albedo',
    equation: (s, v, c) =>
      Math.max(0, Math.min(1, 2.8 - 0.01 * v('temperature'))),
  },
  {
    id: 'ice',
    equation: (s, v, c) => -323 + 1.5 * v('temperature'),
  },
  {
    id: 'temperature',
    equation: (s, v, c) => s('planet heat content') / v('heat capacity'),
  },
  {
    id: 'heat capacity',
    equation: (s, v, c) => c('water depth') * 4.2e6,
  },
];

const constants = [
  {
    id: 'water depth',
    value: 1000,
  },
  {
    id: 'solar emissivity',
    value: 1363,
  },
];

const flows = [
  {
    id: 'sun radiation',
    equation: (s, v, c) => (c('solar emissivity') * (1 - v('albedo'))) / 4,
  },
  {
    id: 'earth infrared radiation',
    equation: (s, v, c) => 5.67e-8 * Math.pow(v('temperature'), 4),
  },
];

const secondsPerYear = 60 * 60 * 24 * 365.2425;
const stepSize = secondsPerYear;

export { stocks, variables, constants, flows, stepSize };
