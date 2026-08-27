const router = require('express').Router();
const Collection = require('../../models/Collection');
const Document = require('../../models/Document');
const { authenticate, requireAdmin } = require('../../middleware/auth');

// GET /admin/collections — list all collections
router.get('/', authenticate, async (req, res) => {
  try {
    const collections = await Collection.find()
      .populate('createdBy', 'name')
      .sort({ name: 1 })
      .lean();

    // Attach document count to each collection
    const withCounts = await Promise.all(
      collections.map(async (col) => {
        const count = await Document.countDocuments({ collectionId: col._id, isActive: true });
        return { ...col, documentCount: count };
      })
    );

    res.json(withCounts);
  } catch (err) {
    console.error('GET /admin/collections error:', err);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// POST /admin/collections — create a new collection
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const existing = await Collection.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ error: `Collection "${name}" already exists` });
    const col = await Collection.create({ name: name.trim(), description, createdBy: req.user._id });
    res.status(201).json(col);
  } catch (err) {
    console.error('POST /admin/collections error:', err);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// PUT /admin/collections/:id — rename/update
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const col = await Collection.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, description: req.body.description },
      { new: true }
    );
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    res.json(col);
  } catch (err) {
    console.error('PUT /admin/collections/:id error:', err);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// DELETE /admin/collections/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const col = await Collection.findByIdAndDelete(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    // Unlink documents from this collection (don't delete them)
    await Document.updateMany({ collectionId: req.params.id }, { $unset: { collectionId: 1 } });
    res.json({ success: true, message: `Collection "${col.name}" deleted` });
  } catch (err) {
    console.error('DELETE /admin/collections/:id error:', err);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

module.exports = router;

