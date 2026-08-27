const router = require('express').Router();
const AnalyticsEvent = require('../../models/AnalyticsEvent');
const Message = require('../../models/Message');
const Document = require('../../models/Document');
const Feedback = require('../../models/Feedback');
const { authenticate, requireAdmin } = require('../../middleware/auth');

// GET /admin/analytics — usage stats for dashboard
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const [
    totalQueries,
    totalUploads,
    noAnswerCount,
    feedbackStats,
    queriesPerDay,
    topDocuments,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({ eventType: 'query' }),
    AnalyticsEvent.countDocuments({ eventType: 'upload' }),
    AnalyticsEvent.countDocuments({ eventType: 'no_answer' }),

    // Feedback breakdown
    Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),

    // Queries per day (last 7 days)
    AnalyticsEvent.aggregate([
      { $match: { eventType: 'query', createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Top cited documents (most frequent in message sources)
    Message.aggregate([
      { $unwind: '$sources' },
      { $group: { _id: '$sources.documentId', title: { $first: '$sources.documentTitle' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // Recent unanswered questions
  const unansweredEvents = await AnalyticsEvent.find({ eventType: 'no_answer' })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const unansweredQuestions = unansweredEvents.map((e) => e.metadata?.question).filter(Boolean);

  const feedbackMap = {};
  for (const f of feedbackStats) feedbackMap[f._id] = f.count;

  res.json({
    totalQueries,
    totalUploads,
    noAnswerCount,
    feedback: { up: feedbackMap.up || 0, down: feedbackMap.down || 0 },
    queriesPerDay,
    topDocuments,
    unansweredQuestions,
  });
});

module.exports = router;
