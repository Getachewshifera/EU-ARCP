// Purpose: Publishes admin-authored posts and serves their optional images.
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const { validatePostInput } = require('../validators/postValidator');

const uploadsDirectory = path.resolve(__dirname, '../uploads/posts');

function serializePost(post) {
  const item = typeof post.toObject === 'function' ? post.toObject() : post;
  return {
    ...item,
    imageUrl: item.imageFile ? `/api/posts/${item._id}/image` : '',
  };
}

function streamImage(post, response, next) {
  const imagePath = path.resolve(uploadsDirectory, path.basename(post.imageFile));
  response.type(post.imageMimeType);
  const stream = fs.createReadStream(imagePath);
  stream.on('error', (error) => {
    if (response.headersSent) response.destroy(error);
    else if (error.code === 'ENOENT') response.status(404).json({ message: 'Post image was not found.' });
    else next(error);
  });
  return stream.pipe(response);
}

async function removeFile(filename) {
  if (!filename) return;
  const safeFilename = path.basename(filename);
  try {
    await fsPromises.unlink(path.resolve(uploadsDirectory, safeFilename));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function listPublished(_request, response, next) {
  try {
    const items = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(20)
      .lean();
    return response.json({ items: items.map(serializePost) });
  } catch (error) {
    return next(error);
  }
}

async function listAdmin(_request, response, next) {
  try {
    const items = await Post.find()
      .populate('author', 'name email')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    return response.json({ items: items.map(serializePost) });
  } catch (error) {
    return next(error);
  }
}

async function create(request, response, next) {
  const result = validatePostInput(request.body, { creating: true });
  if (result.error) {
    try {
      await removeFile(request.file?.filename);
    } catch (error) {
      return next(error);
    }
    return response.status(400).json({ message: result.error });
  }

  const status = result.value.status || 'published';
  try {
    const post = await Post.create({
      ...result.value,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      author: request.user._id,
      imageFile: request.file?.filename || '',
      imageMimeType: request.file?.mimetype || '',
    });
    return response.status(201).json({ item: serializePost(post) });
  } catch (error) {
    try {
      await removeFile(request.file?.filename);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') console.error('Unable to remove failed post image upload:', cleanupError);
    }
    return next(error);
  }
}

async function update(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    try {
      await removeFile(request.file?.filename);
    } catch (error) {
      return next(error);
    }
    return response.status(400).json({ message: 'Post id is invalid.' });
  }
  const result = validatePostInput(request.body);
  if (result.error) {
    try {
      await removeFile(request.file?.filename);
    } catch (error) {
      return next(error);
    }
    return response.status(400).json({ message: result.error });
  }

  try {
    const post = await Post.findById(request.params.id);
    if (!post) {
      await removeFile(request.file?.filename);
      return response.status(404).json({ message: 'Post was not found.' });
    }

    const wasPublished = post.status === 'published';
    Object.assign(post, result.value);
    if (result.value.status === 'published' && !wasPublished) post.publishedAt = new Date();
    if (result.value.status === 'draft') post.publishedAt = null;

    const oldImage = request.file ? post.imageFile : '';
    if (request.file) {
      post.imageFile = request.file.filename;
      post.imageMimeType = request.file.mimetype;
    }
    await post.save();
    try {
      await removeFile(oldImage);
    } catch (cleanupError) {
      console.error('Unable to remove replaced post image:', cleanupError);
    }
    return response.json({ item: serializePost(post) });
  } catch (error) {
    try {
      await removeFile(request.file?.filename);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') console.error('Unable to remove failed post image upload:', cleanupError);
    }
    return next(error);
  }
}

async function remove(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: 'Post id is invalid.' });
  }
  try {
    const post = await Post.findByIdAndDelete(request.params.id);
    if (!post) return response.status(404).json({ message: 'Post was not found.' });
    await removeFile(post.imageFile);
    return response.json({ message: 'Post deleted.' });
  } catch (error) {
    return next(error);
  }
}

async function image(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: 'Post id is invalid.' });
  }
  try {
    const post = await Post.findById(request.params.id).select('imageFile imageMimeType status');
    if (!post || !post.imageFile || post.status !== 'published') {
      return response.status(404).json({ message: 'Post image was not found.' });
    }
    response.set('Cache-Control', 'public, max-age=300');
    return streamImage(post, response, next);
  } catch (error) {
    return next(error);
  }
}

async function adminImage(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: 'Post id is invalid.' });
  }
  try {
    const post = await Post.findById(request.params.id).select('imageFile imageMimeType');
    if (!post || !post.imageFile) return response.status(404).json({ message: 'Post image was not found.' });
    response.set('Cache-Control', 'private, no-store');
    return streamImage(post, response, next);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listPublished, listAdmin, create, update, remove, image, adminImage };
