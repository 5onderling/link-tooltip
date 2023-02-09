declare global {
  type BetterMouseEvent = MouseEvent & { target: HTMLElement };

  var FloatingUIDOM: typeof import('@floating-ui/dom');
}

export {};
