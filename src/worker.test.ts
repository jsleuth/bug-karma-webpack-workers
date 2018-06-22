import * as Worker from 'worker-loader!./worker';

describe('Worker', () => {
  // Allow 30 seconds per test
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30 * 1000;

  it('Should load and handle messages', async () => {
    const worker = new Worker();
    worker.addEventListener('message', (event: MessageEvent) => {
      expect(event.data).toMatch('aloha');
    });
    worker.postMessage('aloha');
  });

});
