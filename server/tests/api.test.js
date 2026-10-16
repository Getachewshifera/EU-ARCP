const assert = require('node:assert/strict');
const test = require('node:test');
const app = require('../server');

async function withServer(run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('protected API routes reject unauthenticated requests before database access', async () => {
  await withServer(async (baseUrl) => {
    const [userResponse, adminResponse, resourceWriteResponse, deleteUserResponse] = await Promise.all([
      fetch(`${baseUrl}/api/users/me`),
      fetch(`${baseUrl}/api/admin/dashboard`),
      fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized category' }),
      }),
      fetch(`${baseUrl}/api/users/507f1f77bcf86cd799439011`, { method: 'DELETE' }),
    ]);

    assert.equal(userResponse.status, 401);
    assert.equal(adminResponse.status, 401);
    assert.equal(resourceWriteResponse.status, 401);
    assert.equal(deleteUserResponse.status, 401);
  });
});

test('health and unmatched routes have explicit HTTP status responses', async () => {
  await withServer(async (baseUrl) => {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const missingResponse = await fetch(`${baseUrl}/api/not-a-route`);

    assert.equal(healthResponse.status, 503);
    assert.deepEqual(await healthResponse.json(), { status: 'unavailable' });
    assert.equal(missingResponse.status, 404);
    assert.match((await missingResponse.json()).message, /Route not found/);
  });
});

test('public contact endpoint rejects invalid input before database access', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /valid name, email, subject, and message/);
  });
});
