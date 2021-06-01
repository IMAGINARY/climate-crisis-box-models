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

export { loadSvg };
