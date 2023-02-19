declare global {
  type BetterMouseEvent = MouseEvent & { target: HTMLElement };
}

export {};
