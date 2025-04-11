const nanoid = require('nanoid');
const QRCode = require('qrcode');
const Url = require('../models/Url');
const UAParser = require('ua-parser-js');

// Create short URL
exports.createUrl = async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresAt } = req.body;
    const shortId = customAlias || nanoid(6);

    // Check if custom alias already exists
    if (customAlias) {
      const existingUrl = await Url.findOne({ shortId });
      if (existingUrl) {
        return res.status(400).json({ message: 'Custom alias already in use' });
      }
    }

    const url = new Url({
      originalUrl,
      shortId,
      customAlias,
      expiresAt,
      user: req.user.id
    });

    await url.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(`${process.env.BASE_URL}/${shortId}`);

    res.json({
      url: {
        originalUrl,
        shortUrl: `${process.env.BASE_URL}/${shortId}`,
        shortId,
        _id: url._id,
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt,
        qrCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all URLs for user
exports.getUrls = async (req, res) => {
  try {
    const urlsFromDB = await Url.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-analytics'); // Keep excluding analytics if needed

    // Map results to include the full shortUrl
    const urls = urlsFromDB.map(url => ({
      _id: url._id,
      originalUrl: url.originalUrl,
      shortUrl: `${process.env.BASE_URL}/${url.shortId}`, // Construct the full URL
      shortId: url.shortId,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      // Add any other fields the frontend expects
    }));

    res.json(urls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Redirect to original URL
exports.redirectUrl = async (req, res) => {
  try {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Check if URL has expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      return res.status(410).json({ message: 'URL has expired' });
    }

    // Update click count
    url.clicks += 1;

    // Log analytics data
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();

    url.analytics.push({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      device: ua.device.type || 'desktop',
      browser: ua.browser.name,
      os: ua.os.name,
      country: req.headers['cf-ipcountry'] || 'Unknown',
      city: req.headers['cf-ipcity'] || 'Unknown'
    });

    await url.save();

    // Redirect to original URL
    res.redirect(url.originalUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete URL
exports.deleteUrl = async (req, res) => {
  try {
    const deleteResult = await Url.deleteOne({
      _id: req.params.id,
      user: req.user.id // Ensure user owns the URL
    });

    // Check if a document was actually deleted
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: 'URL not found or access denied' });
    }

    // Send back the ID of the deleted URL for the frontend reducer
    res.json({ id: req.params.id, message: 'URL deleted successfully' });

  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ message: 'Server error during URL deletion' });
  }
}; 