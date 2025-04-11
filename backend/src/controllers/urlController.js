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

    // Create the new URL document
    const newUrl = new Url({
      originalUrl,
      shortId,
      customAlias,
      expiresAt,
      user: req.user.id
    });

    // Save it to the database
    const savedUrl = await newUrl.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(`${process.env.BASE_URL}/${savedUrl.shortId}`);

    // Construct the response object using the SAVED data
    const responseUrl = {
      _id: savedUrl._id,
      originalUrl: savedUrl.originalUrl,
      shortUrl: `${process.env.BASE_URL}/${savedUrl.shortId}`,
      shortId: savedUrl.shortId,
      clicks: savedUrl.clicks,
      createdAt: savedUrl.createdAt,
      expiresAt: savedUrl.expiresAt,
      qrCode: qrCode
    };

    // Send the complete object nested under 'url' key
    res.status(201).json({ url: responseUrl });
  } catch (error) {
    console.error('Error creating URL:', error);
    // Handle potential duplicate key error for shortId more gracefully
    if (error.code === 11000 && error.keyPattern && error.keyPattern.shortId) {
      return res.status(400).json({ message: 'Generated short ID conflict, please try again.' });
    }
    res.status(500).json({ message: 'Server error creating URL' });
  }
};

// Get all URLs for user
exports.getUrls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    // Build query with search capability
    const query = { user: req.user.id };
    
    // Add search functionality if search parameter is provided
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Count total matching documents for pagination info
    const total = await Url.countDocuments(query);
    
    // Get paginated results
    const urlsFromDB = await Url.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-analytics'); // Keep excluding analytics if needed

    // Map results to include the full shortUrl and generate QR codes
    const urls = await Promise.all(urlsFromDB.map(async url => {
      // Generate QR code for each URL
      const qrCode = await QRCode.toDataURL(`${process.env.BASE_URL}/${url.shortId}`);
      
      return {
        _id: url._id,
        originalUrl: url.originalUrl,
        shortUrl: `${process.env.BASE_URL}/${url.shortId}`, // Construct the full URL
        shortId: url.shortId,
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        qrCode: qrCode
      };
    }));

    // Return URLs with pagination info
    res.json({
      urls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
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

// Delete a URL
exports.deleteUrl = async (req, res) => {
  try {
    const url = await Url.findOne({
      _id: req.params.id,
      user: req.user.id // Ensure user owns this URL
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found or you do not have permission to delete it' });
    }

    await Url.deleteOne({ _id: req.params.id });

    res.json({ message: 'URL deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ message: 'Server error deleting URL' });
  }
}; 