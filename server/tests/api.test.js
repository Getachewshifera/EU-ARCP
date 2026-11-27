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
    const [userResponse, adminResponse, passwordResetResponse, resourceWriteResponse, deleteUserResponse, postWriteResponse, appearanceWriteResponse, maintenanceWriteResponse, chatSettingsWriteResponse, privateMessagesResponse, groupMessagesResponse, groupReactionResponse, materialDownloadResponse, hideConversationResponse, pinConversationResponse, blockConversationResponse, reactionResponse, deleteMessageResponse] = await Promise.all([
      fetch(`${baseUrl}/api/users/me`),
      fetch(`${baseUrl}/api/admin/dashboard`),
      fetch(`${baseUrl}/api/admin/users/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student-104' }),
      }),
      fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized category' }),
      }),
      fetch(`${baseUrl}/api/users/507f1f77bcf86cd799439011`, { method: 'DELETE' }),
      fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        body: new FormData(),
      }),
      fetch(`${baseUrl}/api/site/appearance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor: '#2563eb', backgroundColor: '#f4f7fb' }),
      }),
      fetch(`${baseUrl}/api/site/maintenance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, message: 'Maintenance in progress.' }),
      }),
      fetch(`${baseUrl}/api/site/chat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      }),
      fetch(`${baseUrl}/api/private-messages/conversations`),
      fetch(`${baseUrl}/api/groups/507f1f77bcf86cd799439011/messages`),
      fetch(`${baseUrl}/api/groups/507f1f77bcf86cd799439011/messages/507f1f77bcf86cd799439012/reactions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: '👍' }),
      }),
      fetch(`${baseUrl}/api/materials/507f1f77bcf86cd799439011/download`),
      fetch(`${baseUrl}/api/private-messages/conversations/507f1f77bcf86cd799439011:507f1f77bcf86cd799439012`, { method: 'DELETE' }),
      fetch(`${baseUrl}/api/private-messages/conversations/507f1f77bcf86cd799439011:507f1f77bcf86cd799439012/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: true }),
      }),
      fetch(`${baseUrl}/api/private-messages/conversations/507f1f77bcf86cd799439011:507f1f77bcf86cd799439012/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: true }),
      }),
      fetch(`${baseUrl}/api/private-messages/conversations/507f1f77bcf86cd799439011:507f1f77bcf86cd799439012/507f1f77bcf86cd799439013/reactions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: '👍' }),
      }),
      fetch(`${baseUrl}/api/private-messages/conversations/507f1f77bcf86cd799439011:507f1f77bcf86cd799439012/507f1f77bcf86cd799439013?scope=me`, { method: 'DELETE' }),
    ]);

    assert.equal(userResponse.status, 401);
    assert.equal(adminResponse.status, 401);
    assert.equal(passwordResetResponse.status, 401);
    assert.equal(resourceWriteResponse.status, 401);
    assert.equal(deleteUserResponse.status, 401);
    assert.equal(postWriteResponse.status, 401)
    assert.equal(appearanceWriteResponse.status, 401)
    assert.equal(maintenanceWriteResponse.status, 401)
    assert.equal(chatSettingsWriteResponse.status, 401)
    assert.equal(privateMessagesResponse.status, 401)
    assert.equal(groupMessagesResponse.status, 401)
    assert.equal(groupReactionResponse.status, 401)
    assert.equal(materialDownloadResponse.status, 401)
    assert.equal(hideConversationResponse.status, 401)
    assert.equal(pinConversationResponse.status, 401)
    assert.equal(blockConversationResponse.status, 401)
    assert.equal(reactionResponse.status, 401)
    assert.equal(deleteMessageResponse.status, 401)
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
