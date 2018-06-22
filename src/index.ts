import * as Worker from 'worker-loader!./worker';

const worker = new Worker();

worker.addEventListener('message', (event: MessageEvent) => {
  console.log('index message returned', event);
});
worker.postMessage('hi');