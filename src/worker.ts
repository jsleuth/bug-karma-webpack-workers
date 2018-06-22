console.log('JMS worker file');

function isWindow(object: any): boolean {
  return Boolean(object && typeof object === 'object' && typeof object.setInterval === 'function');
}

const $self = (typeof self === 'object' && isWindow(self) && self);
const $global = (typeof global === 'object' && isWindow(global) && global);
const $this = new Function('return this')(); // eslint-disable-line no-new-func
const WINDOW: any = ($self || $global || $this);

WINDOW.addEventListener('message', (event: MessageEvent): any => {
  console.log('JMS inworker', event);
  WINDOW.postMessage(event);
});