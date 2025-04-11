const express = require('express');
const auth = require('../middleware/auth.middleware');
const URL = require('../models/url.model');
const Analytics = require('../models/analytics.model');
const UAParser = require('ua-parser-js');
const router = express.Router();

// Log click event
router.post('/click/:shortId', async (req, res) => {
  try {
    const url = await URL.findOne({
      $or: [
        { shortId: req.params.shortId },
        { customAlias: req.params.shortId }
      ]
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    // Check if URL has expired
    if (url.hasExpired()) {
      return res.status(410).json({
        success: false,
        message: 'URL has expired'
      });
    }

    // Parse user agent
    const ua = new UAParser(req.headers['user-agent']);
    const userAgent = {
      browser: {
        name: ua.getBrowser().name,
        version: ua.getBrowser().version
      },
      os: {
        name: ua.getOS().name,
        version: ua.getOS().version
      },
      device: ua.getDevice()
    };

    // Create analytics entry
    const analytics = new Analytics({
      urlId: url._id,
      ip: req.ip,
      userAgent,
      referrer: req.headers.referer || ''
    });

    // Save analytics asynchronously
    analytics.save().catch(console.error);

    // Increment click count
    url.clicks += 1;
    url.save().catch(console.error);

    res.json({
      success: true,
      url: url.originalUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing click',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get URL analytics
router.get('/url/:urlId', auth, async (req, res) => {
  try {
    const url = await URL.findOne({
      _id: req.params.urlId,
      userId: req.user._id
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    const timeframe = req.query.timeframe || 'all';

    // Get click statistics
    const clickStats = await Analytics.getClickStats(url._id, timeframe);
    const deviceStats = await Analytics.getDeviceStats(url._id);
    const browserStats = await Analytics.getBrowserStats(url._id);

    res.json({
      success: true,
      analytics: {
        totalClicks: url.clicks,
        clickStats,
        deviceStats,
        browserStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const urls = await URL.find({ userId: req.user._id });
    const urlIds = urls.map(url => url._id);

    // Get total clicks
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

    // Get click statistics for all URLs
    const clickStats = await Analytics.aggregate([
      { $match: { urlId: { $in: urlIds } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Get device statistics
    const deviceStats = await Analytics.aggregate([
      { $match: { urlId: { $in: urlIds } } },
      {
        $group: {
          _id: "$userAgent.device.type",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get browser statistics
    const browserStats = await Analytics.aggregate([
      { $match: { urlId: { $in: urlIds } } },
      {
        $group: {
          _id: "$userAgent.browser.name",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUrls: urls.length,
        totalClicks,
        clickStats,
        deviceStats,
        browserStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 