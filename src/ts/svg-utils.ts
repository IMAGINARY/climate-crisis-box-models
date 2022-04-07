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

function prefixCssClasses(svg: XMLDocument, classPrefix: string): void {
  // prefix CSS classes for scoping purposes
  const styleElements = svg.querySelectorAll('style');
  for (let i = 0; i < styleElements.length; i += 1) {
    const styleElement = styleElements[i];
    const styleSheet = styleElement.sheet;
    if (styleSheet !== null) {
      for (let j = 0; j < styleSheet.cssRules.length; j += 1) {
        const cssRule = styleSheet.cssRules[j];
        if (cssRule instanceof CSSStyleRule) {
          cssRule.selectorText = cssRule.selectorText.replaceAll(
            /\./g,
            `.${classPrefix}`
          );
        }
      }
      styleElement.textContent = Array.from(styleSheet.cssRules)
        .map((r) => r.cssText)
        .join('\n');
    }
  }
  svg.querySelectorAll('*').forEach((elem) => {
    if (elem.classList.length !== 0) {
      // eslint-disable-next-line no-param-reassign
      elem.classList.value = Array.from(elem.classList)
        .map((c) => `${classPrefix}${c}`)
        .join(' ');
    }
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

function preprocessSvg(svg: XMLDocument, cssClassPrefix: string): void {
  repaidPaths(svg);
  hideHardcodedGraphs(svg);
  addSunAnimation(svg);
  prefixCssClasses(svg, cssClassPrefix);
}

// eslint-disable-next-line import/prefer-default-export
export { preprocessSvg };
