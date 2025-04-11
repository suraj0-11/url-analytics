const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// @route   GET api/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', auth, analyticsController.getDashboardStats);

// @route   GET api/analytics/:urlId
// @desc    Get analytics for specific URL
// @access  Private
router.get('/:urlId', auth, analyticsController.getUrlAnalytics);

module.exports = router; 