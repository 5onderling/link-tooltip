// TODO: FOR BACKGROUND IMAGES TOO?! Maybe not svg, so not icons

import { computePosition, offset, shift, autoUpdate, Strategy } from '@floating-ui/dom';
import { getTooltip, style, wait } from './shared';

const getImageSize = async (img: HTMLImageElement): Promise<{ w: number; h: number }> => {
  if (img.naturalWidth && img.naturalHeight) return { w: img.naturalWidth, h: img.naturalHeight };
  await wait();
  return getImageSize(img);
};

let lastImage: HTMLImageElement;
let cleanup: () => void;

const checkKeys = (event: KeyboardEvent) => event.key === 's';

const showImageSize = async (event: KeyboardEvent) => {
  if (!checkKeys(event)) return;

  const img = document.querySelector<HTMLImageElement>('img:hover');
  if (!img || lastImage === img) return;

  const { w, h } = await getImageSize(img);

  const tooltip = getTooltip(`${w} x ${h}`);

  const hideToast = (event: KeyboardEvent) => {
    if (!checkKeys(event)) return;

    window.removeEventListener('keyup', hideToast);

    style(tooltip, { visibility: 'hidden' });
    lastImage = undefined;
    if (cleanup) cleanup(), (cleanup = undefined);
  };

  window.removeEventListener('keyup', hideToast);
  window.addEventListener('keyup', hideToast);

  let strategy: Strategy = 'absolute';
  let oldX = 0;
  let oldY = 0;

  const updatePosition = async () => {
    const { x, y, middlewareData } = await computePosition(img, tooltip, {
      middleware: [
        offset(({ rects }) => -rects.reference.height / 2 - rects.floating.height / 2),
        shift({ padding: 5, crossAxis: true }),
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
  cleanup = autoUpdate(img, tooltip, updatePosition);
  lastImage = img;
};

window.addEventListener('keydown', showImageSize);
