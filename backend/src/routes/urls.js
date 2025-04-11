const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const auth = require('../middleware/auth');

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

// @route   GET api/urls/:shortId
// @desc    Redirect to original URL
// @access  Public
router.get('/:shortId', urlController.redirectUrl);

module.exports = router; 