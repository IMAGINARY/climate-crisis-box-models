import { Key } from 'ts-key-enum';

const keyStrings: string[] = Object.values(Key);

type Parser<T> = (s: string) => T;

function parseBoolean(s: string): boolean {
  if (s === '' || s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  throw TypeError('Expected <boolean>.');
}

function booleanParser() {
  return parseBoolean;
}

function parseFloat(s: string): number {
  const f = Number.parseFloat(s);
  if (Number.isFinite(f)) {
    return f;
  }
  throw TypeError('Expected <float>.');
}

function floatParser() {
  return parseFloat;
}

function parseInt(s: string): number {
  const i = Number.parseInt(s, 10);
  if (`${i}` === s) {
    return i;
  }
  throw TypeError('Expected <integer>.');
}

function intParser() {
  return parseInt;
}

function parseStrings(s: string, ...strings: string[]): string {
  if (strings.includes(s)) {
    return s;
  }
  throw TypeError(`Expected ${strings.toString()}`);
}

function stringsParser(...strings: string[]) {
  return (s: string) => parseStrings(s, ...strings);
}

function parseIntOrStrings(s: string, ...strings: string[]): string | number {
  try {
    return parseInt(s);
  } catch (e1) {
    try {
      return parseStrings(s, ...strings);
    } catch (e2) {
      throw TypeError(`Expected <integer> or ${strings.toString()}`);
    }
  }
}

function intOrStringsParser(...strings: string[]) {
  return (s: string) => parseIntOrStrings(s, ...strings);
}

function parseString(s: string) {
  return s;
}

function stringParser() {
  return parseString;
}

function parseKey(s: string): KeyboardEvent['key'] {
  if (s.length > 0) {
    if (s.length === 1) return s;
    if (keyStrings.includes(s)) return s;
  }
  throw TypeError('Expected <key> compatible with KeyboardEvent.key.');
}

function keyParser() {
  return parseKey;
}

export {
  Parser,
  booleanParser,
  floatParser,
  intParser,
  stringsParser,
  intOrStringsParser,
  stringParser,
  keyParser,
};
