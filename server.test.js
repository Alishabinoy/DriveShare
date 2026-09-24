const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { getNextAvailablePort } = require('./server');

function listenOnRandomPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ port, server });
    });
  });
}

test('getNextAvailablePort skips occupied ports', async () => {
  const { port: busyPort, server } = await listenOnRandomPort();

  try {
    const nextPort = await getNextAvailablePort(busyPort);

    assert.notEqual(nextPort, busyPort);
    assert.ok(typeof nextPort === 'number');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
