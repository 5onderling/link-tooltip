export const wait = (time = 100) => new Promise((resolve) => setTimeout(resolve, time));

export const style = (
  element: HTMLElement,
  styles: Partial<Record<keyof CSSStyleDeclaration, string>>,
) => {
  for (const property in styles) {
    element.style.setProperty(
      property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      styles[property],
      'important',
    );
  }
};

let tooltip: HTMLDivElement;
let tooltipInner: HTMLSpanElement;
export const getTooltip = (text: string) => {
  const initial = !tooltip;
  if (initial) {
    tooltip = document.createElement('div');
    style(tooltip, {
      all: 'initial',
      visibility: 'hidden',
      position: 'absolute',
      top: '0px',
      left: '0px',
      zIndex: '1000000000000',
    });
    tooltipInner = document.createElement('span');
    style(tooltipInner, {
      display: 'block',
      fontSize: '0.75em',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderRadius: '0.25em',
      padding: '0.25em 0.5em',
      color: 'white',
      fontFamily: 'sans-serif',
    });
    tooltip.append(tooltipInner);
  }

  tooltipInner.innerText = text;

  if (initial) document.body.append(tooltip);

  return tooltip;
};
