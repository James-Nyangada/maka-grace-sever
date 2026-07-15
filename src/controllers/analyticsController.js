const Booking = require('../models/Booking');
const Enquiry = require('../models/Enquiry');
const Package = require('../models/Package');
const axios = require('axios');

const getPostHogData = async (query) => {
  try {
    const projectId = process.env.POSTHOG_PROJECT_ID || '@current';
    const response = await axios.post(
      `${process.env.POSTHOG_HOST}/api/projects/${projectId}/query/`,
      {
        query: {
          kind: 'HogQLQuery',
          query: query
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('PostHog API Error:', error.response?.data || error.message);
    return null;
  }
};

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    // Get Unique Visitors from PostHog
    let currentVisitors = 0;
    let previousVisitors = 0;
    
    // We can query both current and previous periods
    const visitorQueryCurrent = `SELECT count(DISTINCT person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 30 day AND timestamp < now()`;
    const visitorQueryPrev = `SELECT count(DISTINCT person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 60 day AND timestamp < now() - interval 30 day`;
    
    const [phCurrent, phPrev] = await Promise.all([
      getPostHogData(visitorQueryCurrent),
      getPostHogData(visitorQueryPrev)
    ]);

    if (phCurrent && phCurrent.results && phCurrent.results.length > 0) {
      currentVisitors = phCurrent.results[0][0] || 0;
    }
    if (phPrev && phPrev.results && phPrev.results.length > 0) {
      previousVisitors = phPrev.results[0][0] || 0;
    }

    // Get Enquiries
    const currentEnquiries = await Enquiry.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const previousEnquiries = await Enquiry.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    // Get Bookings
    const currentBookings = await Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: thirtyDaysAgo } });
    const previousBookings = await Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    // Get Revenue
    const getRevenue = async (startDate, endDate) => {
      const matchQuery = { status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: startDate } };
      if (endDate) {
        matchQuery.createdAt.$lt = endDate;
      }
      const revenueAgg = await Booking.aggregate([
        { $match: matchQuery },
        { $lookup: { from: 'packages', localField: 'packageId', foreignField: '_id', as: 'package' } },
        { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
        { $addFields: { estimatedRevenue: { $multiply: [{ $ifNull: ['$package.priceFrom', 0] }, { $ifNull: ['$adults', 1] }] } } },
        { $group: { _id: null, total: { $sum: '$estimatedRevenue' } } }
      ]);
      return revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    };

    const currentRevenue = await getRevenue(thirtyDaysAgo);
    const previousRevenue = await getRevenue(sixtyDaysAgo, thirtyDaysAgo);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const conversionRate = currentVisitors > 0 
      ? ((currentEnquiries + currentBookings) / currentVisitors) * 100 
      : 0;

    res.status(200).json({
      uniqueVisitors: { current: currentVisitors, previous: previousVisitors, growth: calculateGrowth(currentVisitors, previousVisitors) },
      totalEnquiries: { current: currentEnquiries, previous: previousEnquiries, growth: calculateGrowth(currentEnquiries, previousEnquiries) },
      confirmedBookings: { current: currentBookings, previous: previousBookings, growth: calculateGrowth(currentBookings, previousBookings) },
      totalRevenue: { current: currentRevenue, previous: previousRevenue, growth: calculateGrowth(currentRevenue, previousRevenue), currency: "USD" },
      conversionRate: Number(conversionRate.toFixed(2))
    });
  } catch (error) {
    console.error('Analytics Overview Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTrafficVsConversions = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Get daily page views from PostHog
    const trafficQuery = `SELECT toDate(timestamp) as day, count() as page_views FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 30 day GROUP BY day ORDER BY day`;
    const phTraffic = await getPostHogData(trafficQuery);
    
    const trafficMap = {};
    if (phTraffic && phTraffic.results) {
      phTraffic.results.forEach(row => {
        trafficMap[row[0]] = row[1];
      });
    }

    // Get daily enquiries from MongoDB
    const dailyEnquiries = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);
    
    const enquiryMap = {};
    dailyEnquiries.forEach(item => {
      enquiryMap[item._id] = item.count;
    });

    // Generate 30 days of data points
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        pageViews: trafficMap[dateStr] || 0,
        enquiries: enquiryMap[dateStr] || 0
      });
    }

    res.status(200).json({ data });
  } catch (error) {
    console.error('Traffic vs Conversions Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTopPackages = async (req, res) => {
  try {
    const topPackages = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $lookup: { from: 'packages', localField: 'packageId', foreignField: '_id', as: 'package' } },
      { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
      { $addFields: { estimatedRevenue: { $multiply: [{ $ifNull: ['$package.priceFrom', 0] }, { $ifNull: ['$adults', 1] }] } } },
      { $group: {
        _id: '$packageName',
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$estimatedRevenue' },
      }},
      { $addFields: { avgValue: { $cond: [{ $eq: ['$totalBookings', 0] }, 0, { $divide: ['$totalRevenue', '$totalBookings'] }] } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $project: { packageName: '$_id', totalBookings: 1, totalRevenue: 1, avgValue: { $round: ['$avgValue', 0] }, _id: 0 } }
    ]);

    res.status(200).json({ data: topPackages });
  } catch (error) {
    console.error('Top Packages Error:', error);
    res.status(500).json({ error: error.message });
  }
};
