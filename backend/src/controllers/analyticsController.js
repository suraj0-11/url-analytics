const Url = require('../models/Url');

// Get analytics data for a specific URL
exports.getUrlAnalytics = async (req, res) => {
  try {
    const url = await Url.findOne({
      _id: req.params.urlId,
      user: req.user.id // Ensure the user owns the URL
    }).select('originalUrl shortId analytics'); // Select necessary fields

    if (!url) {
      return res.status(404).json({ message: 'URL not found or access denied' });
    }

    // Optionally process/format analytics data here if needed
    const analyticsData = url.analytics;

    res.json({
        originalUrl: url.originalUrl,
        shortId: url.shortId,
        analytics: analyticsData
    });

  } catch (error) {
    console.error('Error fetching URL analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const urls = await Url.find({ user: req.user.id });

    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
    const activeUrls = urls.filter(url => !url.expiresAt || new Date() < url.expiresAt).length;

    // Get top performing URLs
    const topUrls = urls
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map(url => ({
        originalUrl: url.originalUrl,
        shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
        clicks: url.clicks
      }));

    res.json({
      totalUrls,
      totalClicks,
      activeUrls,
      topUrls
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}; 