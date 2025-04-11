const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'URL',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String
  },
  userAgent: {
    browser: {
      name: String,
      version: String
    },
    os: {
      name: String,
      version: String
    },
    device: {
      type: String,
      vendor: String,
      model: String
    }
  },
  referrer: {
    type: String
  },
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number
  }
});

// Index for faster analytics queries
analyticsSchema.index({ urlId: 1, timestamp: -1 });

// Static method to get click statistics
analyticsSchema.statics.getClickStats = async function(urlId, timeframe = 'all') {
  const match = { urlId: mongoose.Types.ObjectId(urlId) };
  
  if (timeframe !== 'all') {
    const date = new Date();
    switch(timeframe) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    match.timestamp = { $gte: date };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get device statistics
analyticsSchema.statics.getDeviceStats = async function(urlId) {
  return this.aggregate([
    { $match: { urlId: mongoose.Types.ObjectId(urlId) } },
    {
      $group: {
        _id: "$userAgent.device.type",
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get browser statistics
analyticsSchema.statics.getBrowserStats = async function(urlId) {
  return this.aggregate([
    { $match: { urlId: mongoose.Types.ObjectId(urlId) } },
    {
      $group: {
        _id: "$userAgent.browser.name",
        count: { $sum: 1 }
      }
    }
  ]);
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics; 