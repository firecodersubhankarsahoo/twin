const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const ingestController = require('../controllers/ingestController');
const chatController = require('../controllers/chatController');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.post('/ingest/upload', upload.single('file'), ingestController.uploadFile);
router.post('/ingest/url', ingestController.ingestUrl);
router.post('/chat', chatController.handleChat);

module.exports = router;
