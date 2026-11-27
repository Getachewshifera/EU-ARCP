const assert = require('node:assert/strict');
const test = require('node:test');
const { createMaintenanceMiddleware } = require('../middleware/maintenanceMiddleware');

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

test('maintenance mode blocks non-admin requests and returns the configured message', async () => {
  const middleware = createMaintenanceMiddleware({
    connection: { readyState: 1 },
    getState: async () => ({ enabled: true, message: 'We are updating the service.' }),
    authenticate: (_request, _response, next) => next(),
  });
  const response = createResponse();
  let continued = false;

  await middleware({ path: '/materials' }, response, () => { continued = true; });

  assert.equal(continued, false);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, {
    maintenance: true,
    message: 'We are updating the service.',
  });
});

test('maintenance mode allows admins and the status endpoint', async () => {
  let lookups = 0;
  const middleware = createMaintenanceMiddleware({
    connection: { readyState: 1 },
    getState: async () => {
      lookups += 1;
      return { enabled: true, message: 'Maintenance.' };
    },
    authenticate: (request, _response, next) => {
      request.user = { role: 'admin' };
      return next();
    },
  });
  let adminContinued = false;
  await middleware({ path: '/users' }, createResponse(), () => { adminContinued = true; });
  assert.equal(adminContinued, true);

  const uppercaseAdminMiddleware = createMaintenanceMiddleware({
    connection: { readyState: 1 },
    getState: async () => ({ enabled: true, message: 'Maintenance.' }),
    authenticate: (request, _response, next) => {
      request.user = { role: 'ADMIN' };
      return next();
    },
  });
  let uppercaseAdminContinued = false;
  await uppercaseAdminMiddleware({ path: '/users' }, createResponse(), () => { uppercaseAdminContinued = true; });
  assert.equal(uppercaseAdminContinued, true);

  let statusContinued = false;
  await middleware({ path: '/site/maintenance' }, createResponse(), () => { statusContinued = true; });
  assert.equal(statusContinued, true);
  assert.equal(lookups, 1);
});
