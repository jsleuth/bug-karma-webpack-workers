import * as Worker from 'worker-loader!./worker';

console.log('JMS raw worker', Worker);

describe('Worker', () => {
  // Allow 30 seconds per test
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30 * 1000;

  it('Should load', async () => {
    console.log('JMS and a test');
    const worker = new Worker();
    //console.log('JMS worker', worker, worker.postMessage('aloha'));
    worker.addEventListener('message', (event: MessageEvent) => {
      console.log('JMS message returned', event);
      expect(event.data).toMatch('aloha');
    });
    worker.postMessage('aloha');
  });

});
