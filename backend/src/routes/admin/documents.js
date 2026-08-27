const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../../models/Document');
const Chunk = require('../../models/Chunk');
const Collection = require('../../models/Collection');
const AnalyticsEvent = require('../../models/AnalyticsEvent');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const { ingestDocument, reingestDocument } = require('../../services/ingestionService');

// ─── Multer config ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') cb(null, true);
    else cb(new Error('Only PDF and TXT files are accepted'));
  },
});

// ─── Document routes ──────────────────────────────────────────────────────────

// POST /admin/documents — upload and start ingestion
router.post('/', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });

  const { title, collectionId } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const fileUrl = `/uploads/${req.file.filename}`;
  const doc = await Document.create({
    collectionId: collectionId || null,
    title,
    filename: req.file.originalname,
    fileUrl,
    uploadedBy: req.user._id,
    status: 'processing',
  });

  // Fire-and-forget background ingestion
  ingestDocument(doc._id.toString(), req.file.path).catch((err) =>
    console.error('[Upload] Ingestion error:', err.message)
  );

  // Log analytics
  AnalyticsEvent.create({
    eventType: 'upload',
    userId: req.user._id,
    metadata: { documentId: doc._id, title, filename: req.file.originalname },
  }).catch(() => {});

  res.status(201).json(doc);
});

// GET /admin/documents — list all documents
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { collectionId, status } = req.query;
  const filter = {};
  if (collectionId) filter.collectionId = collectionId;
  if (status) filter.status = status;

  const docs = await Document.find(filter)
    .populate('collectionId', 'name')
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  res.json(docs);
});

// GET /admin/documents/:id — single document
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate('collectionId', 'name')
    .lean();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

// POST /admin/documents/:id/retry — retry a stuck or failed ingestion
router.post('/:id/retry', authenticate, requireAdmin, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  reingestDocument(doc).catch((err) =>
    console.error('[Retry] Ingestion error:', err.message)
  );

  res.json({ success: true, message: 'Document reprocessing started', status: 'processing' });
});

// DELETE /admin/documents/:id — soft delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const doc = await Document.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true, message: 'Document deactivated (soft delete)' });
});

// PUT /admin/documents/:id — upload new version
router.put('/:id', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  const oldDoc = await Document.findById(req.params.id);
  if (!oldDoc) return res.status(404).json({ error: 'Document not found' });

  // Deactivate old version
  await Document.findByIdAndUpdate(req.params.id, { isActive: false });

  if (!req.file) return res.status(400).json({ error: 'New file required for version update' });

  const { title, collectionId } = req.body;
  const newDoc = await Document.create({
    collectionId: collectionId || oldDoc.collectionId,
    title: title || oldDoc.title,
    filename: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
    version: oldDoc.version + 1,
    status: 'processing',
  });

  // Fire-and-forget ingestion
  ingestDocument(newDoc._id.toString(), req.file.path).catch((err) =>
    console.error('[Replace] Ingestion error:', err.message)
  );

  res.status(201).json(newDoc);
});

module.exports = router;
