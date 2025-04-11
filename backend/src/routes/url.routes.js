const express = require('express');
const QRCode = require('qrcode');
const auth = require('../middleware/auth.middleware');
const URL = require('../models/url.model');
const router = express.Router();

// Create short URL
router.post('/', auth, async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresAt } = req.body;

    // Validate URL
    try {
      new URL(originalUrl);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL provided'
      });
    }

    // Check if custom alias is available
    if (customAlias) {
      const existingUrl = await URL.findOne({ customAlias });
      if (existingUrl) {
        return res.status(400).json({
          success: false,
          message: 'Custom alias already in use'
        });
      }
    }

    // Create URL document
    const url = new URL({
      originalUrl,
      customAlias,
      userId: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await url.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(url.shortUrl);

    res.status(201).json({
      success: true,
      url: {
        ...url.toObject(),
        shortUrl: url.shortUrl,
        qrCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating short URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all URLs for user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {
      userId: req.user._id,
      $or: [
        { originalUrl: { $regex: search, $options: 'i' } },
        { customAlias: { $regex: search, $options: 'i' } }
      ]
    };

    const urls = await URL.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await URL.countDocuments(query);

    // Generate QR codes for all URLs
    const urlsWithQR = await Promise.all(
      urls.map(async (url) => {
        const qrCode = await QRCode.toDataURL(url.shortUrl);
        return {
          ...url.toObject(),
          shortUrl: url.shortUrl,
          qrCode
        };
      })
    );

    res.json({
      success: true,
      urls: urlsWithQR,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching URLs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete URL
router.delete('/:id', auth, async (req, res) => {
  try {
    const url = await URL.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    await url.remove();

    res.json({
      success: true,
      message: 'URL deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 