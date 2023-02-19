/** @type {HTMLDivElement} */
let tooltip;
/** @type {HTMLSpanElement} */
let tooltipInner;

/** @type {HTMLAnchorElement} */
let lastLink;

/** @type {() => void} */
let cleanup;

/**
 * @param {HTMLElement} element
 * @param {Partial<Record<keyof CSSStyleDeclaration, string>>} styles
 */
const style = (element, styles) => {
  for (const property in styles) {
    element.style.setProperty(
      property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      styles[property],
      'important',
    );
  }
};

/** @param {BetterMouseEvent | KeyboardEvent} event */
const checkKeys = (event) => event.ctrlKey || event.metaKey;

/** @param {BetterMouseEvent | KeyboardEvent} event */
const showToast = async (event) => {
  const link =
    event instanceof KeyboardEvent
      ? /** @type {HTMLAnchorElement[]} */ (Array.from(document.querySelectorAll('a:hover'))).pop()
      : event.target?.closest('a');
  if (lastLink === link || !link?.href) return;

  if (!checkKeys(event)) return;

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

  tooltipInner.innerText = link.href;

  if (initial) document.body.append(tooltip);

  /** @param {KeyboardEvent} event */
  const hideToast = (event) => {
    if (checkKeys(event)) return;

    window.removeEventListener('keyup', hideToast);

    style(tooltip, { visibility: 'hidden' });
    lastLink = undefined;
    if (cleanup) cleanup(), (cleanup = undefined);
  };

  window.removeEventListener('keyup', hideToast);
  window.addEventListener('keyup', hideToast);

  /** @type {string} */
  let oldPlacement;
  /** @type {import("@floating-ui/dom").Strategy} */
  let strategy = 'absolute';
  let oldX = 0;
  let oldY = 0;

  const updatePosition = async () => {
    const { x, y, placement, middlewareData } = await FloatingUIDOM.computePosition(link, tooltip, {
      middleware: [
        FloatingUIDOM.offset(5),
        FloatingUIDOM.flip({ padding: 5 }),
        FloatingUIDOM.shift({ padding: 5, crossAxis: true }),
      ],
      placement: 'top',
      strategy,
    });
    if (oldX === x && oldY === y) return;
    if (!oldPlacement) oldPlacement = placement;
    if (oldPlacement && placement !== oldPlacement) {
      style(tooltip, { transition: 'transform 50ms ease' });
      tooltip.addEventListener('transitionend', () => style(tooltip, { transition: '' }));
      oldPlacement = placement;
    }
    style(tooltip, { visibility: '', position: strategy, transform: `translate(${x}px, ${y}px)` });
    strategy = middlewareData.shift.y ? 'fixed' : 'absolute';
    oldX = x;
    oldY = y;
  };

  if (cleanup) {
    cleanup();
    cleanup = undefined;
    style(tooltip, { transition: 'transform 150ms ease' });
    tooltip.addEventListener('transitionend', () => style(tooltip, { transition: '' }));
  }
  cleanup = FloatingUIDOM.autoUpdate(link, tooltip, updatePosition);
  lastLink = link;
};

// TODO: remove listener when not active tab, reattach when active with delay
setTimeout(() => {
  window.addEventListener('mouseover', showToast);
  window.addEventListener('keydown', showToast);
}, 100);
