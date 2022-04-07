function prefixCssClasses(svg: XMLDocument, classPrefix: string) {
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

// eslint-disable-next-line import/prefer-default-export
export { prefixCssClasses };
