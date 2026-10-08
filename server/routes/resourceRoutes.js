// Purpose: Builds collection routes with public reads and admin-only writes.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const createResourceController = require('../controllers/resourceController');

function createResourceRouter(Model, { adminRead = false } = {}) {
  const router = express.Router();
  const controller = createResourceController(Model);
  if (adminRead) router.use(authMiddleware, adminMiddleware);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', authMiddleware, adminMiddleware, controller.create);
  router.put('/:id', authMiddleware, adminMiddleware, controller.update);
  router.delete('/:id', authMiddleware, adminMiddleware, controller.remove);
  return router;
}

module.exports = createResourceRouter;
