const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

// AWS S3 Configuration
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  bucketName: process.env.S3_BUCKET || 'your-bucket-name'
};

// Configure AWS
if (s3Config.accessKeyId && s3Config.secretAccessKey) {
  AWS.config.update({
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
    region: s3Config.region
  });
} else {
  console.error('❌ AWS credentials not found in environment variables');
  console.error('Please check your .env file or environment variables');
}

// Create S3 instance
const s3 = new AWS.S3();

// Multer configuration for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images, PDFs, and documents are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// S3 upload function
const uploadToS3 = async (file, folder = 'documents') => {
  try {
    // Check if AWS credentials are available
    if (!s3Config.accessKeyId || !s3Config.secretAccessKey) {
      return {
        success: false,
        error: 'AWS credentials not configured. Please check environment variables.'
      };
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${timestamp}-${randomString}${fileExtension}`;

    const uploadParams = {
      Bucket: s3Config.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    const result = await s3.upload(uploadParams).promise();

    return {
      success: true,
      url: result.Location,
      key: result.Key,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    return { success: false, error: error.message };
  }
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  try {
    if (!s3Config.accessKeyId || !s3Config.secretAccessKey) {
      return {
        success: false,
        error: 'AWS credentials not configured. Please check environment variables.'
      };
    }

    const deleteParams = {
      Bucket: s3Config.bucketName,
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    return { success: false, error: error.message };
  }
};

// Get file info from S3
const getFileInfo = async (key) => {
  try {
    if (!s3Config.accessKeyId || !s3Config.secretAccessKey) {
      return {
        success: false,
        error: 'AWS credentials not configured. Please check environment variables.'
      };
    }

    const headParams = {
      Bucket: s3Config.bucketName,
      Key: key
    };

    const result = await s3.headObject(headParams).promise();
    return {
      success: true,
      info: {
        key: key,
        size: result.ContentLength,
        contentType: result.ContentType,
        lastModified: result.LastModified
      }
    };
  } catch (error) {
    console.error('❌ S3 get info error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { s3, upload, uploadToS3, deleteFromS3, getFileInfo, s3Config }; 