import assert from 'assert';

function repaidPaths(svg: XMLDocument): void {
  // adapt path data of <path> elements for parsing with SVG.js
  const pathElements = svg.querySelectorAll('path');
  pathElements.forEach((pathElement) => {
    const d = pathElement.getAttribute('d');
    if (d !== null) {
      const dFixed = d.replaceAll(/\s+/g, ' ').trim();
      pathElement.setAttribute('d', dFixed);
    }
  });
}

function filterCSSStyleRules<T extends CSSRule>(
  rules: CSSRule[],
  ruleType: new () => T
): CSSStyleRule[] {
  return rules.filter((rule) => rule instanceof ruleType) as CSSStyleRule[];
}

async function extractCSSStyleRules(
  styleElement: HTMLStyleElement
): Promise<CSSStyleRule[]> {
  if (styleElement.sheet) {
    return filterCSSStyleRules(
      Array.from(styleElement.sheet.cssRules),
      CSSStyleRule
    );
  }

  // The following is for web browsers that don't support the sheet property
  // (Safari at the time of writing)

  // create temporary <link> element for parsing the stylesheet
  const iframe = document.createElement('iframe');
  iframe.width = '0';
  iframe.height = '0';
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const styleWindow = iframe.contentWindow;
  assert(styleWindow !== null);
  const styleDoc = iframe.contentDocument;
  assert(styleDoc !== null);
  const link = styleDoc.createElement('link');
  link.rel = 'stylesheet';
  link.href = URL.createObjectURL(
    new Blob([styleElement.textContent ?? ''], { type: 'text/css' })
  );
  const linkPromise = new Promise((resolve) => {
    link.onload = resolve;
  });
  styleDoc.head.prepend(link);
  // eslint-disable-next-line no-await-in-loop
  await linkPromise;
  const styleSheet = Array.from(styleDoc.styleSheets).find(
    (s) => s.ownerNode === link
  );
  assert(styleSheet);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const CSSStyleRuleOfCtx = styleWindow.CSSStyleRule as typeof CSSStyleRule;

  const cssStyleRules = filterCSSStyleRules(
    Array.from(styleSheet.cssRules),
    CSSStyleRuleOfCtx
  );

  iframe.remove();

  return cssStyleRules;
}

async function scopeCssClasses(
  svg: XMLDocument,
  parentSelector: string
): Promise<void> {
  // prefix CSS classes for scoping purposes
  const styleElements = Array.from(svg.querySelectorAll('style'));
  const styleElementsAndSheets = await Promise.all(
    styleElements.map(
      async (styleElement): Promise<[HTMLStyleElement, CSSStyleRule[]]> => [
        styleElement,
        await extractCSSStyleRules(styleElement),
      ]
    )
  );

  styleElementsAndSheets.forEach(([styleElement, cssStyleRules]) => {
    cssStyleRules.forEach((cssStyleRule) => {
      /**
       * Prefix each selector in a CSS selector group.
       * Ignore commas inside attribute selectors,
       * because they don't separate selector group elements.
       */
      // eslint-disable-next-line no-param-reassign
      cssStyleRule.selectorText = cssStyleRule.selectorText
        .replace(/^/, `${parentSelector} `)
        .replaceAll(/,(([^,[]*|\[[^\]]*])*)/g, `, ${parentSelector} $1`);
    });
    // eslint-disable-next-line no-param-reassign
    styleElement.textContent = cssStyleRules.map((r) => r.cssText).join('\n');
  });
}

function hideHardcodedGraphs(svg: XMLDocument): void {
  const graphNodes = svg.querySelectorAll('[id^=graph1], [id^=graph2]');
  graphNodes.forEach((n) => {
    assert(n instanceof SVGElement);
    // eslint-disable-next-line no-param-reassign
    n.style.display = 'none';
  });
}

function addSunAnimation(svg: XMLDocument): void {
  // assign a transform origin to the layers of the sun
  // the actual animation is done via CSS animations
  const sunOrigin = svg.querySelector('[id^=sun-anchor]') as SVGElement;
  assert(sunOrigin !== null);
  const cx = sunOrigin.getAttribute('cx');
  const cy = sunOrigin.getAttribute('cy');
  assert(cx !== null && cy !== null);

  const sunLayers: NodeListOf<SVGElement> = svg.querySelectorAll(
    '[id^=sun-min] > *, [id^=sun-max] > *'
  );
  assert(sunLayers.length !== 0);
  Array.from(sunLayers).forEach((sunLayer) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,no-param-reassign
    sunLayer.style.transformOrigin = `${cx}px ${cy}px`;
  });
}

async function preprocessSvg(
  svg: XMLDocument,
  parentClassName: string
): Promise<void> {
  repaidPaths(svg);
  hideHardcodedGraphs(svg);
  addSunAnimation(svg);
  svg.documentElement.classList.add(parentClassName);
  const parentSelector = `.${parentClassName}`;
  await scopeCssClasses(svg, parentSelector);
}

// eslint-disable-next-line import/prefer-default-export
export { preprocessSvg };
