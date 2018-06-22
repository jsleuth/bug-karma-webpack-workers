import * as Worker from 'worker-loader!./worker';

const worker = new Worker();

console.log('jms', worker);

//worker.onmessage = (event: MessageEvent) => {console.log('JMS got message', event);};
 
worker.addEventListener('message', (event: MessageEvent) => {
  console.log('JMS message returned', event);
});
worker.postMessage('hi');