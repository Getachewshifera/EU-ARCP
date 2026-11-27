const assert = require('node:assert/strict');
const test = require('node:test');
const SiteAppearance = require('../models/SiteAppearance');
const chatEnabledMiddleware = require('../middleware/chatEnabledMiddleware');

function createResponse() {
  return {
    statusCode: 200,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function stubSettings(settings) {
  const originalFindOne = SiteAppearance.findOne;
  SiteAppearance.findOne = () => ({
    select() {
      return this;
    },
    async lean() {
      return settings;
    },
  });
  return () => { SiteAppearance.findOne = originalFindOne; };
}

test('chat API middleware blocks requests when chat is disabled', async (context) => {
  context.after(stubSettings({ chatEnabled: false }));
  const response = createResponse();
  let continued = false;

  await chatEnabledMiddleware({}, response, () => { continued = true; });

  assert.equal(continued, false);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { message: 'Chat has been disabled by an administrator.' });
});

test('chat API middleware allows requests when no disabled setting exists', async (context) => {
  context.after(stubSettings(null));
  const response = createResponse();
  let continued = false;

  await chatEnabledMiddleware({}, response, () => { continued = true; });

  assert.equal(continued, true);
  assert.equal(response.statusCode, 200);
});
