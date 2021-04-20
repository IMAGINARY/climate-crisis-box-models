export type IVPIntegrator = (
  y: number[],
  x: number,
  h: number,
  derivatives: (y: number[], x: number) => number[]
) => number[];

export function euler(
  y: number[],
  x: number,
  h: number,
  derivatives: (y: number[], x: number) => number[]
) {
  const dydx = derivatives(y, x);
  return y.map((_, i) => y[i] + h * dydx[i]);
}

export function rk4(
  y: number[],
  x: number,
  h: number,
  derivatives: (y: number[], x: number) => number[]
) {
  const n: number = y.length;

  const dydx = derivatives(y, x);
  const yt: number[] = Array(n);

  const hh = h / 2.0;
  const h6 = h / 6.0;
  const xhh = x + hh;

  for (let i: number = 0; i < n; i += 1) yt[i] = y[i] + hh * dydx[i];
  let dyt = derivatives(yt, xhh);

  for (let i: number = 0; i < n; i += 1) yt[i] = y[i] + hh * dyt[i];
  const dym = derivatives(yt, xhh);

  for (let i: number = 0; i < n; i += 1) {
    yt[i] = y[i] + h * dym[i];
    dym[i] += dyt[i];
  }
  dyt = derivatives(yt, x + h);

  return y.map((_, i) => y[i] + h6 * (dydx[i] + dyt[i] + 2.0 * dym[i]));
}
