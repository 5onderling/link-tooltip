// TODO: FOR BACKGROUND IMAGES TOO?! Maybe not svg, so not icons

/** @type {HTMLImageElement} */
let lastImage;

const wait = (time = 100) => new Promise((resolve) => setTimeout(resolve, time));

/**
 * @param {HTMLImageElement} img
 * @returns {Promise<{ w: number, h: number }>}
 */
const getImageSize = async (img) => {
  if (img.naturalWidth && img.naturalHeight) return { w: img.naturalWidth, h: img.naturalHeight };
  await wait();
  return getImageSize(img);
};

/** @param {KeyboardEvent} event */
const showImageSize = async (event) => {
  if (event.key !== 's') return;

  /** @type {HTMLImageElement} */
  const img = document.querySelector('img:hover');
  if (!img || lastImage === img) return;

  const { w, h } = await getImageSize(img);

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

  tooltipInner.innerText = `${w} x ${h}`;

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

  /** @type {import("@floating-ui/dom").Strategy} */
  let strategy = 'absolute';
  let oldX = 0;
  let oldY = 0;

  const updatePosition = async () => {
    const { x, y, middlewareData } = await FloatingUIDOM.computePosition(img, tooltip, {
      middleware: [
        FloatingUIDOM.offset(
          ({ rects }) => -rects.reference.height / 2 - rects.floating.height / 2,
        ),
        FloatingUIDOM.shift({ padding: 5, crossAxis: true }),
      ],
      placement: 'bottom',
      strategy,
    });
    if (oldX === x && oldY === y) return;
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
  cleanup = FloatingUIDOM.autoUpdate(img, tooltip, updatePosition);
  lastImage = img;
};

window.addEventListener('keydown', showImageSize);
