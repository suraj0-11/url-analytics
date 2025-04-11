const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const auth = require('../middleware/auth');
const QRCode = require('qrcode');

// @route   POST api/urls
// @desc    Create short URL
// @access  Private
router.post('/', auth, urlController.createUrl);

// @route   GET api/urls
// @desc    Get all URLs for user
// @access  Private
router.get('/', auth, urlController.getUrls);

// @route   DELETE api/urls/:id
// @desc    Delete URL
// @access  Private
router.delete('/:id', auth, urlController.deleteUrl);

// @route   GET api/urls/qr
// @desc    Generate QR code for a URL
// @access  Private
router.get('/qr', auth, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(url);
    
    res.json({ qrCode });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Server error generating QR code' });
  }
});

// @route   GET api/urls/:shortId
// @desc    Redirect to original URL
// @access  Public
router.get('/:shortId', urlController.redirectUrl);

module.exports = router; 