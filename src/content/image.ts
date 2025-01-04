// TODO: FOR BACKGROUND IMAGES TOO?! Maybe not svg, so not icons

import { autoUpdate, computePosition, offset, shift, Strategy } from '@floating-ui/dom';
import { getTooltip, style, wait } from './shared';

const getImageSize = async (img: HTMLImageElement): Promise<{ w: number; h: number }> => {
  if (img.naturalWidth && img.naturalHeight) return { w: img.naturalWidth, h: img.naturalHeight };
  await wait();
  return getImageSize(img);
};

let lastImage: HTMLImageElement;
let cleanup: () => void;

const checkKeys = (event: KeyboardEvent) => !event.ctrlKey && !event.metaKey && event.key === 's';

const showImageSize = async (event: KeyboardEvent) => {
  if (!checkKeys(event)) return;

  const img = document.querySelector<HTMLImageElement>('img:hover');
  if (!img) return;

  event.preventDefault();

  if (lastImage === img) return;

  const { w, h } = await getImageSize(img);
  const tooltip = getTooltip(`${w} x ${h}`);

  const hideToast = (event?: KeyboardEvent) => {
    if (event && !checkKeys(event)) return;

    window.removeEventListener('keyup', hideToast);
    window.removeEventListener('keydown', downloadImage);

    style(tooltip, { visibility: 'hidden', transform: '' });
    lastImage = undefined;
    if (cleanup) cleanup(), (cleanup = undefined);
  };
  window.removeEventListener('keyup', hideToast);
  window.addEventListener('keyup', hideToast);

  const downloadImage = async (event: KeyboardEvent) => {
    if (event.key !== 'd') return;

    const srcUrl = new URL(img.src);

    // always download the best/original file from twitter
    if (srcUrl.host === 'pbs.twimg.com') srcUrl.searchParams.set('name', 'orig');

    const res = await chrome.runtime.sendMessage(srcUrl.href);
    if (res) {
      const anchor = document.createElement('a');
      anchor.href = srcUrl.href;
      style(anchor, { display: 'none' });
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    }
    hideToast();
  };
  window.removeEventListener('keydown', downloadImage);
  window.addEventListener('keydown', downloadImage);

  let strategy: Strategy = 'absolute';
  let oldX = 0;
  let oldY = 0;

  const updatePosition = async () => {
    const { x, y, middlewareData } = await computePosition(img, tooltip, {
      middleware: [
        offset(({ rects }) => ({
          mainAxis: -rects.reference.height / 2 - rects.floating.height / 2,
          crossAxis: rects.reference.width / 2 - rects.floating.width / 2,
        })),
        shift({ padding: 5, crossAxis: true }),
      ],
      placement: 'bottom-start',
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
