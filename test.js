const assert = require('assert');
const http = require('http');
// Start the server
const server = require('./app');
// Test the health endpoint
http.get('http://localhost:3000/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const body = JSON.parse(data);
    assert.strictEqual(res.statusCode, 200, 'Status should be 200');
    assert.strictEqual(body.status, 'ok', 'Status field should be ok');
    console.log('All tests passed');
    server.close();
  });
});