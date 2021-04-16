export function euler(
  y: number[],
  h: number,
  derivs: (y: number[]) => number[]
) {
  const dydx = derivs(y);
  return y.map((_, i) => y[i] + h * dydx[i]);
}

export function rk4(y: number[], h: number, derivs: (y: number[]) => number[]) {
  const n: number = y.length;

  const dydx = derivs(y);
  const yt: number[] = Array(n);

  const hh = h / 2.0;
  const h6 = h / 6.0;

  for (let i: number = 0; i < n; i += 1) yt[i] = y[i] + hh * dydx[i];
  let dyt = derivs(yt);

  for (let i: number = 0; i < n; i += 1) yt[i] = y[i] + hh * dyt[i];
  const dym = derivs(yt);

  for (let i: number = 0; i < n; i += 1) {
    yt[i] = y[i] + h * dym[i];
    dym[i] += dyt[i];
  }
  dyt = derivs(yt);

  return y.map((_, i) => y[i] + h6 * (dydx[i] + dyt[i] + 2.0 * dym[i]));
}
