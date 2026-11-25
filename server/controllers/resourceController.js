// Purpose: Provides validated CRUD handlers for simple reference collections.
const mongoose = require('mongoose');
const University = require('../models/University');
const College = require('../models/College');
const Department = require('../models/Department');
const Program = require('../models/Program');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getReferenceId(value) {
  return value && typeof value === 'object' ? value._id ?? value.id : value;
}

async function validateAndNormalizeReferences(Model, values, current = null) {
  for (const field of Object.keys(values)) {
    const schemaPath = Model.schema.path(field);
    if (values[field] === '' && schemaPath?.instance === 'ObjectId') values[field] = null;
    if (values[field] === '' && schemaPath?.instance === 'Number') values[field] = null;
  }

  if (Model.modelName === 'College' && values.university) {
    if (!mongoose.isValidObjectId(values.university)
      || !await University.exists({ _id: values.university })) {
      return 'Select an existing university.';
    }
  }

  if (Model.modelName === 'Department' && ('college' in values || 'university' in values)) {
    const collegeId = getReferenceId(values.college ?? current?.college);
    if (!mongoose.isValidObjectId(collegeId)) return 'Select an existing college.';
    const college = await College.findById(collegeId).select('university').lean();
    if (!college) return 'The selected college was not found.';

    const universityId = getReferenceId(values.university ?? current?.university);
    if (universityId && String(universityId) !== String(college.university)) {
      return 'Select a college belonging to the selected university.';
    }
    values.university = college.university;
  }

  if (Model.modelName === 'Program' && values.department) {
    if (!mongoose.isValidObjectId(values.department)
      || !await Department.exists({ _id: values.department })) {
      return 'Select an existing department.';
    }
  }

  if (Model.modelName === 'Course' && ('department' in values || 'program' in values)) {
    let program = null;
    const programId = getReferenceId(values.program ?? current?.program);
    if (programId) {
      if (!mongoose.isValidObjectId(programId)) return 'Select an existing program.';
      program = await Program.findById(programId).select('department').lean();
      if (!program) return 'The selected program was not found.';
    }

    let departmentId = getReferenceId(values.department ?? current?.department);
    if ('program' in values && !('department' in values) && program?.department) {
      departmentId = String(program.department);
      values.department = program.department;
    }
    if (departmentId) {
      if (!mongoose.isValidObjectId(departmentId)
        || !await Department.exists({ _id: departmentId })) {
        return 'Select an existing department.';
      }
      if (program?.department && String(program.department) !== String(departmentId)) {
        return 'Select a program belonging to the selected department.';
      }
    }
  }

  return '';
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
        const referenceError = await validateAndNormalizeReferences(Model, values);
        if (referenceError) return response.status(400).json({ message: referenceError });
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
        const referenceError = await validateAndNormalizeReferences(Model, values, item);
        if (referenceError) return response.status(400).json({ message: referenceError });
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
