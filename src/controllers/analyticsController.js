const Booking = require('../models/Booking');
const Enquiry = require('../models/Enquiry');
const Package = require('../models/Package');
const axios = require('axios');

/**
 * Query PostHog HogQL API with proper error handling and logging.
 * Falls back gracefully if PostHog is not configured or unreachable.
 */
const getPostHogData = async (query) => {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const host = process.env.POSTHOG_HOST;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!apiKey || !host || !projectId) {
    console.warn('[Analytics] PostHog env vars missing — skipping PostHog query.');
    return null;
  }

  try {
    const response = await axios.post(
      `${host}/api/projects/${projectId}/query/`,
      {
        query: {
          kind: 'HogQLQuery',
          query: query
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.response?.data?.error || error.message;
    console.error('[Analytics] PostHog API Error:', detail);
    return null;
  }
};

/**
 * Helper: calculate growth percentage between two periods.
 */
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

/**
 * Helper: generate an array of date strings (YYYY-MM-DD) for the last N days.
 * Uses UTC to match PostHog's date output.
 */
const generateDateRange = (days) => {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// ──────────────────────────────────────────────────
// GET /api/analytics/overview
// ──────────────────────────────────────────────────
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    // ── PostHog: Unique Visitors ──
    // Use distinct_id which is always set (even for anonymous users),
    // unlike person_id which may be empty for unidentified visitors.
    let currentVisitors = 0;
    let previousVisitors = 0;

    const [phCurrent, phPrev] = await Promise.all([
      getPostHogData(
        `SELECT count(DISTINCT distinct_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 30 day`
      ),
      getPostHogData(
        `SELECT count(DISTINCT distinct_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 60 day AND timestamp < now() - interval 30 day`
      )
    ]);

    if (phCurrent?.results?.[0]?.[0] != null) {
      currentVisitors = Number(phCurrent.results[0][0]);
    }
    if (phPrev?.results?.[0]?.[0] != null) {
      previousVisitors = Number(phPrev.results[0][0]);
    }

    // ── MongoDB: Enquiries (including all form submissions like Bookings) ──
    const [
      currentEnquiriesOnly, previousEnquiriesOnly,
      currentBookingsOnly, previousBookingsOnly
    ] = await Promise.all([
      Enquiry.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Enquiry.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Booking.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
    ]);

    const currentEnquiries = currentEnquiriesOnly + currentBookingsOnly;
    const previousEnquiries = previousEnquiriesOnly + previousBookingsOnly;

    // ── MongoDB: Confirmed Bookings ──
    const [currentBookings, previousBookings] = await Promise.all([
      Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: thirtyDaysAgo } }),
      Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
    ]);

    // ── MongoDB: Revenue (Booking → Package lookup) ──
    const getRevenue = async (startDate, endDate) => {
      const match = { status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: startDate } };
      if (endDate) match.createdAt = { ...match.createdAt, $lt: endDate };

      const result = await Booking.aggregate([
        { $match: match },
        { $lookup: { from: 'packages', localField: 'packageId', foreignField: '_id', as: 'package' } },
        { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
        { $addFields: {
          estimatedRevenue: {
            $multiply: [
              { $ifNull: ['$package.priceFrom', 0] },
              { $ifNull: ['$adults', 1] }
            ]
          }
        }},
        { $group: { _id: null, total: { $sum: '$estimatedRevenue' } } }
      ]);
      return result.length > 0 ? result[0].total : 0;
    };

    const [currentRevenue, previousRevenue] = await Promise.all([
      getRevenue(thirtyDaysAgo),
      getRevenue(sixtyDaysAgo, thirtyDaysAgo)
    ]);

    // ── Conversion Rate ──
    const conversionRate = currentVisitors > 0
      ? ((currentEnquiries + currentBookings) / currentVisitors) * 100
      : 0;

    res.status(200).json({
      uniqueVisitors: {
        current: currentVisitors,
        previous: previousVisitors,
        growth: calculateGrowth(currentVisitors, previousVisitors)
      },
      totalEnquiries: {
        current: currentEnquiries,
        previous: previousEnquiries,
        growth: calculateGrowth(currentEnquiries, previousEnquiries)
      },
      confirmedBookings: {
        current: currentBookings,
        previous: previousBookings,
        growth: calculateGrowth(currentBookings, previousBookings)
      },
      totalRevenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: calculateGrowth(currentRevenue, previousRevenue),
        currency: 'USD'
      },
      conversionRate: Number(conversionRate.toFixed(2))
    });
  } catch (error) {
    console.error('[Analytics] Overview Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/analytics/traffic-vs-conversions
// ──────────────────────────────────────────────────
exports.getTrafficVsConversions = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // ── PostHog: Daily page views ──
    const phTraffic = await getPostHogData(
      `SELECT toDate(timestamp) as day, count() as page_views FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 30 day GROUP BY day ORDER BY day`
    );

    const trafficMap = {};
    if (phTraffic?.results) {
      phTraffic.results.forEach(row => {
        // PostHog returns dates as "YYYY-MM-DD" strings in UTC
        const dateKey = String(row[0]);
        trafficMap[dateKey] = Number(row[1]) || 0;
      });
    }

    // ── MongoDB: Daily enquiries and bookings (all forms) ──
    const [dailyEnquiries, dailyBookings] = await Promise.all([
      Enquiry.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 }
        }}
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 }
        }}
      ])
    ]);

    const enquiryMap = {};
    dailyEnquiries.forEach(item => {
      enquiryMap[item._id] = (enquiryMap[item._id] || 0) + item.count;
    });
    dailyBookings.forEach(item => {
      enquiryMap[item._id] = (enquiryMap[item._id] || 0) + item.count;
    });

    // ── Merge into 30-day array using UTC dates ──
    const dateRange = generateDateRange(30);
    const data = dateRange.map(dateStr => ({
      date: dateStr,
      pageViews: trafficMap[dateStr] || 0,
      enquiries: enquiryMap[dateStr] || 0
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('[Analytics] Traffic vs Conversions Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/analytics/top-packages
// ──────────────────────────────────────────────────
exports.getTopPackages = async (req, res) => {
  try {
    const topPackages = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $lookup: { from: 'packages', localField: 'packageId', foreignField: '_id', as: 'package' } },
      { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        estimatedRevenue: {
          $multiply: [
            { $ifNull: ['$package.priceFrom', 0] },
            { $ifNull: ['$adults', 1] }
          ]
        }
      }},
      { $group: {
        _id: { $ifNull: ['$packageName', 'Unknown Package'] },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$estimatedRevenue' }
      }},
      { $addFields: {
        avgValue: {
          $cond: [
            { $eq: ['$totalBookings', 0] },
            0,
            { $round: [{ $divide: ['$totalRevenue', '$totalBookings'] }, 0] }
          ]
        }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $project: {
        _id: 0,
        packageName: '$_id',
        totalBookings: 1,
        totalRevenue: 1,
        avgValue: 1
      }}
    ]);

    res.status(200).json({ data: topPackages });
  } catch (error) {
    console.error('[Analytics] Top Packages Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/analytics/locations
// ──────────────────────────────────────────────────
exports.getVisitorLocations = async (req, res) => {
  try {
    // ── PostHog: Visitor locations by country name ──
    const phLocations = await getPostHogData(
      `SELECT properties.$geoip_country_name as country, count(DISTINCT distinct_id) as visitors FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 30 day AND properties.$geoip_country_name IS NOT NULL GROUP BY country ORDER BY visitors DESC LIMIT 200`
    );

    const locations = [];
    if (phLocations?.results) {
      phLocations.results.forEach(row => {
        const country = String(row[0]);
        const visitors = Number(row[1]) || 0;
        if (country) {
          locations.push({ id: country, value: visitors });
        }
      });
    } else {
      // Fallback dummy data if PostHog isn't available
      locations.push(
        { id: "United States of America", value: 450 },
        { id: "Kenya", value: 300 },
        { id: "United Kingdom", value: 150 },
        { id: "Tanzania", value: 100 },
        { id: "South Africa", value: 80 }
      );
    }

    res.status(200).json({ data: locations });
  } catch (error) {
    console.error('[Analytics] Visitor Locations Error:', error);
    res.status(500).json({ error: error.message });
  }
};
