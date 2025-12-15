const { processFile, processUrl } = require('../services/ingestionService');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let type = 'text';
        if (req.file.mimetype === 'application/pdf') type = 'pdf';
        else if (req.file.mimetype.startsWith('audio/')) type = 'audio';
        else if (req.file.mimetype.startsWith('image/')) type = 'image';

        const docId = await processFile(req.file, type);
        res.json({ message: 'File ingested successfully', docId });
    } catch (error) {
        console.error("Ingestion Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.ingestUrl = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const docId = await processUrl(url);
        res.json({ message: 'URL ingested successfully', docId });
    } catch (error) {
        console.error("URL Ingestion Error:", error);
        res.status(500).json({ error: error.message });
    }
};
