// Purpose: Provides validated CRUD handlers for simple reference collections.
const mongoose = require('mongoose');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createResourceController(Model) {
  const writableFields = Object.keys(Model.schema.paths).filter((field) => (
    !['_id', '__v', 'createdAt', 'updatedAt', 'password'].includes(field)
  ));

  function cleanBody(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    const keys = Object.keys(body);
    if (!keys.length || keys.some((key) => !writableFields.includes(key))) return null;
    return Object.fromEntries(keys.map((key) => [key, body[key]]));
  }

  return {
    async list(request, response, next) {
      try {
        const filter = {};
        for (const field of writableFields) {
          const value = request.query[field];
          if (typeof value === 'string' && value && value.length <= 200) filter[field] = value;
        }
        if (request.query.q) {
          const textFields = writableFields.filter((field) => ['name', 'title', 'code', 'key'].includes(field));
          if (textFields.length) {
            const expression = new RegExp(escapeRegex(String(request.query.q).slice(0, 100)), 'i');
            filter.$or = textFields.map((field) => ({ [field]: expression }));
          }
        }
        const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 100));
        const [items, total] = await Promise.all([
          Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
          Model.countDocuments(filter),
        ]);
        return response.json({ items, total, page, pages: Math.ceil(total / limit) });
      } catch (error) {
        return next(error);
      }
    },

    async get(request, response, next) {
      if (!mongoose.isValidObjectId(request.params.id)) {
        return response.status(400).json({ message: 'Record id is invalid.' });
      }
      try {
        const item = await Model.findById(request.params.id).lean();
        if (!item) return response.status(404).json({ message: 'Record was not found.' });
        return response.json({ item });
      } catch (error) {
        return next(error);
      }
    },

    async create(request, response, next) {
      const values = cleanBody(request.body);
      if (!values) return response.status(400).json({ message: 'Request body contains missing or unsupported fields.' });
      try {
        const item = await Model.create(values);
        return response.status(201).json({ item });
      } catch (error) {
        return next(error);
      }
    },

    async update(request, response, next) {
      if (!mongoose.isValidObjectId(request.params.id)) {
        return response.status(400).json({ message: 'Record id is invalid.' });
      }
      const values = cleanBody(request.body);
      if (!values) return response.status(400).json({ message: 'Request body contains missing or unsupported fields.' });
      try {
        const item = await Model.findById(request.params.id);
        if (!item) return response.status(404).json({ message: 'Record was not found.' });
        Object.assign(item, values);
        await item.save();
        return response.json({ item });
      } catch (error) {
        return next(error);
      }
    },

    async remove(request, response, next) {
      if (!mongoose.isValidObjectId(request.params.id)) {
        return response.status(400).json({ message: 'Record id is invalid.' });
      }
      try {
        const item = await Model.findByIdAndDelete(request.params.id);
        if (!item) return response.status(404).json({ message: 'Record was not found.' });
        return response.json({ message: 'Record deleted.' });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createResourceController;
