import { asyncHandler } from '../middlewares/errorHandler.js';
import { parseFile } from '../services/fileParserService.js';
import { convertMedia, validateFileSize } from '../services/mediaConverterService.js';
import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Upload and parse contact list file (CSV, XLS, XLSX, PDF, XML)
 */
export const uploadContactList = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { file } = req;
  const userId = req.user.id;

  try {
    logger.info('Parsing contact list file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Parse file to extract contacts
    const contacts = await parseFile(file.path, file.mimetype);

    // Save file record to database
    const { data: uploadedFile } = await supabaseAdmin
      .from('uploaded_files')
      .insert([
        {
          user_id: userId,
          original_filename: file.originalname,
          file_type: 'contact_list',
          file_size: file.size,
          storage_path: file.path,
          mime_type: file.mimetype,
          metadata: {
            contacts_count: contacts.length
          }
        }
      ])
      .select()
      .single();

    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      logger.warn('Failed to delete temp file:', err);
    }

    res.json({
      success: true,
      data: {
        fileId: uploadedFile?.id,
        contacts,
        count: contacts.length
      },
      message: `Successfully extracted ${contacts.length} contacts`
    });
  } catch (error) {
    // Clean up on error
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      // Ignore cleanup errors
    }

    logger.error('Upload contact list error:', error);
    throw error;
  }
});

/**
 * Upload media file (image, video, audio, document)
 */
export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { file } = req;
  const userId = req.user.id;

  try {
    logger.info('Processing media file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Validate file size
    const sizeValidation = validateFileSize(file.size, file.mimetype);
    if (!sizeValidation.valid) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size for ${sizeValidation.type} is ${Math.round(sizeValidation.limit / 1024 / 1024)}MB`
      });
    }

    // Convert media if needed
    const convertResult = await convertMedia(file.path, file.mimetype, false);

    const finalPath = convertResult.outputPath;
    const finalMimeType = convertResult.mimeType;

    // Here you would upload to your storage (S3, Cloudinary, etc.)
    // For now, we'll just use a local URL
    const publicUrl = `/uploads/${path.basename(finalPath)}`;

    // Save file record to database
    const { data: uploadedFile } = await supabaseAdmin
      .from('uploaded_files')
      .insert([
        {
          user_id: userId,
          original_filename: file.originalname,
          file_type: 'media',
          file_size: file.size,
          storage_path: finalPath,
          url: publicUrl,
          mime_type: finalMimeType,
          metadata: {
            converted: convertResult.converted,
            original_mime_type: convertResult.originalMimeType
          }
        }
      ])
      .select()
      .single();

    // Clean up original file if different from output
    if (convertResult.converted && file.path !== finalPath) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        logger.warn('Failed to delete original file:', err);
      }
    }

    res.json({
      success: true,
      data: {
        fileId: uploadedFile?.id,
        url: publicUrl,
        mimeType: finalMimeType,
        converted: convertResult.converted
      },
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    // Clean up on error
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      // Ignore cleanup errors
    }

    logger.error('Upload media error:', error);
    throw error;
  }
});

/**
 * Get user's uploaded files
 */
export const getUploadedFiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { fileType } = req.query;

  let query = supabaseAdmin
    .from('uploaded_files')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (fileType) {
    query = query.eq('file_type', fileType);
  }

  const { data: files, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data: files
  });
});

/**
 * Delete uploaded file
 */
export const deleteUploadedFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { data: file } = await supabaseAdmin
    .from('uploaded_files')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Delete from database
  await supabaseAdmin
    .from('uploaded_files')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  // Delete physical file
  try {
    if (file.storage_path && fs.existsSync(file.storage_path)) {
      fs.unlinkSync(file.storage_path);
    }
  } catch (err) {
    logger.warn('Failed to delete physical file:', err);
  }

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
});

export default {
  uploadContactList,
  uploadMedia,
  getUploadedFiles,
  deleteUploadedFile
};
