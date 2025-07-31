const express = require('express');
const multer = require('multer');
const { upload, uploadToS3, deleteFromS3, getFileInfo } = require('../../config/s3.config');
const auth = require('../middleware/auth');
const router = express.Router();

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error('❌ Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Unexpected field name. Use "file" for single upload or "files" for multiple upload.',
        receivedField: error.field,
        expectedFields: ['file', 'files']
      });
    }
    return res.status(400).json({ message: 'File upload error', error: error.message });
  }
  
  // Handle other file upload errors
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({ message: error.message });
  }
  
  next(error);
};

// Universal upload API
router.post('/file', auth, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    console.log('📁 Upload request received:', {
      hasFile: !!req.file,
      fileField: req.file ? req.file.fieldname : 'none',
      fileName: req.file ? req.file.originalname : 'none',
      fileSize: req.file ? req.file.size : 'none',
      mimeType: req.file ? req.file.mimetype : 'none',
      folder: req.body.folder || 'documents'
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine folder based on request body or default to 'documents'
    const folder = req.body.folder || 'documents';
    
    // Validate folder name for security
    const allowedFolders = ['documents', 'medical-certificates', 'profile-pictures', 'referral-attachments'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ 
        message: 'Invalid folder. Allowed folders: documents, medical-certificates, profile-pictures, referral-attachments' 
      });
    }

    // Upload to S3
    const result = await uploadToS3(req.file, folder);

    if (!result.success) {
      return res.status(500).json({ message: 'Upload failed', error: result.error });
    }

    res.json({
      message: 'File uploaded successfully',
      file: result
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Upload multiple files
router.post('/files', auth, upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const folder = req.body.folder || 'documents';
    
    // Validate folder name for security
    const allowedFolders = ['documents', 'medical-certificates', 'profile-pictures', 'referral-attachments'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ 
        message: 'Invalid folder. Allowed folders: documents, medical-certificates, profile-pictures, referral-attachments' 
      });
    }

    const uploadPromises = req.files.map(file => uploadToS3(file, folder));
    const results = await Promise.all(uploadPromises);

    const successful = results.filter(result => result.success);
    const failed = results.filter(result => !result.success);

    res.json({
      message: 'Files uploaded successfully',
      uploaded: successful,
      failed: failed,
      totalUploaded: successful.length,
      totalFailed: failed.length
    });

  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Delete file from S3
router.delete('/file/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);

    const result = await deleteFromS3(decodedKey);

    if (!result.success) {
      return res.status(500).json({ message: 'Delete failed', error: result.error });
    }

    res.json({
      message: 'File deleted successfully',
      key: decodedKey
    });

  } catch (error) {
    console.error('❌ File delete error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

// Get file info
router.get('/file/:key/info', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);

    const result = await getFileInfo(decodedKey);

    if (!result.success) {
      return res.status(404).json({ message: 'File not found', error: result.error });
    }

    res.json({
      message: 'File info retrieved successfully',
      info: result
    });

  } catch (error) {
    console.error('❌ Get file info error:', error);
    res.status(500).json({ message: 'Failed to get file info', error: error.message });
  }
});

module.exports = router; 