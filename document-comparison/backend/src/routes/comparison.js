const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fileParser = require('../services/fileParser');
const similarityService = require('../services/similarityService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, Word, TXT, Excel, CSV'));
    }
  }
});

/**
 * POST /api/compare/one-to-one
 * Compare two documents
 */
router.post('/one-to-one', upload.fields([
  { name: 'source', maxCount: 1 },
  { name: 'target', maxCount: 1 }
]), async (req, res) => {
  try {
    const { threshold = 90 } = req.body;

    if (!req.files.source || !req.files.target) {
      return res.status(400).json({ error: 'Both source and target files are required' });
    }

    const sourceFile = req.files.source[0];
    const targetFile = req.files.target[0];

    // Parse files
    const sourceExt = path.extname(sourceFile.originalname).substring(1);
    const targetExt = path.extname(targetFile.originalname).substring(1);

    const sourceText = await fileParser.parseFile(sourceFile.path, sourceExt);
    const targetText = await fileParser.parseFile(targetFile.path, targetExt);

    // Compare documents
    const comparison = similarityService.compareOneToOne(sourceText, targetText, parseFloat(threshold));

    // Add statistics
    const sourceLines = similarityService.splitIntoLines(sourceText);
    const targetLines = similarityService.splitIntoLines(targetText);
    const statistics = similarityService.getStatistics(comparison.matches, sourceLines, targetLines);

    // Clean up uploaded files
    await fs.unlink(sourceFile.path);
    await fs.unlink(targetFile.path);

    res.json({
      success: true,
      source: {
        name: sourceFile.originalname,
        text: sourceText,
        lines: sourceLines
      },
      target: {
        name: targetFile.originalname,
        text: targetText,
        lines: targetLines
      },
      comparison,
      statistics
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compare/one-to-many
 * Compare one source document with multiple target documents
 */
router.post('/one-to-many', upload.fields([
  { name: 'source', maxCount: 1 },
  { name: 'targets', maxCount: 10 }
]), async (req, res) => {
  try {
    const { threshold = 90 } = req.body;

    if (!req.files.source || !req.files.targets) {
      return res.status(400).json({ error: 'Source file and at least one target file are required' });
    }

    const sourceFile = req.files.source[0];
    const targetFiles = req.files.targets;

    // Parse source file
    const sourceExt = path.extname(sourceFile.originalname).substring(1);
    const sourceText = await fileParser.parseFile(sourceFile.path, sourceExt);
    const sourceLines = similarityService.splitIntoLines(sourceText);

    // Parse all target files
    const targets = await Promise.all(
      targetFiles.map(async (file) => {
        const ext = path.extname(file.originalname).substring(1);
        const text = await fileParser.parseFile(file.path, ext);
        return {
          name: file.originalname,
          text: text,
          path: file.path
        };
      })
    );

    // Compare source with all targets
    const results = similarityService.compareOneToMany(sourceText, targets, parseFloat(threshold));

    // Add detailed info for each target
    const detailedResults = results.map((result, index) => {
      const targetLines = similarityService.splitIntoLines(targets[index].text);
      const statistics = similarityService.getStatistics(result.matches, sourceLines, targetLines);

      return {
        ...result,
        targetText: targets[index].text,
        targetLines: targetLines,
        statistics
      };
    });

    // Clean up uploaded files
    await fs.unlink(sourceFile.path);
    await Promise.all(targetFiles.map(file => fs.unlink(file.path)));

    res.json({
      success: true,
      source: {
        name: sourceFile.originalname,
        text: sourceText,
        lines: sourceLines
      },
      results: detailedResults,
      threshold: parseFloat(threshold)
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parse
 * Parse a single file and return its text content
 */
router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).substring(1);
    const text = await fileParser.parseFile(req.file.path, ext);
    const lines = similarityService.splitIntoLines(text);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      filename: req.file.originalname,
      text: text,
      lines: lines,
      lineCount: lines.length
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
