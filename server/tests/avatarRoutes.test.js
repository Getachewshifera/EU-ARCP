const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const app = require('../server');
const { uploadDirectory } = require('../middleware/uploadMiddleware');

test('legacy registration photo URLs still serve saved profile images', async (context) => {
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.png`;
  const image = Buffer.from('legacy-registration-photo');
  const filePath = path.join(uploadDirectory, filename);
  await fs.writeFile(filePath, image);
  context.after(async () => { await fs.unlink(filePath).catch(() => {}); });

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/legacy-avatars/${filename}`);
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
