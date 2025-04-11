const mongoose = require('mongoose');
const shortid = require('shortid');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortId: {
    type: String,
    required: true,
    unique: true,
    default: shortid.generate
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
urlSchema.index({ shortId: 1 });
urlSchema.index({ userId: 1 });
urlSchema.index({ customAlias: 1 });

// Virtual for full short URL
urlSchema.virtual('shortUrl').get(function() {
  return `${process.env.BASE_URL || 'http://localhost:5000'}/${this.customAlias || this.shortId}`;
});

// Check if URL has expired
urlSchema.methods.hasExpired = function() {
  if (!this.expiresAt) return false;
  return Date.now() >= this.expiresAt.getTime();
};

const URL = mongoose.model('URL', urlSchema);

module.exports = URL; 