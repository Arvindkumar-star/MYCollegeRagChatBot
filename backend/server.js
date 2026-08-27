require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const Document = require('./src/models/Document');
const { reingestDocument } = require('./src/services/ingestionService');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  const stuckDocuments = await Document.find({ status: 'processing', isActive: true });
  for (const document of stuckDocuments) {
    reingestDocument(document).catch((err) =>
      console.error(`[Startup] Failed to reprocess ${document.title}:`, err.message)
    );
  }
  if (stuckDocuments.length) {
    console.log(`🔄 Reprocessing ${stuckDocuments.length} unfinished document(s)`);
  }
  app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
    console.log(`📚 API docs: http://localhost:${PORT}/health`);
  });
})();
