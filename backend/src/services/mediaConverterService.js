import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../config/logger.js';

const unlinkAsync = promisify(fs.unlink);

/**
 * WhatsApp supported formats:
 * Images: JPEG, PNG
 * Videos: MP4, 3GP
 * Audio: AAC, MP3, OGG (Opus), AMR
 * Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
 */

const SUPPORTED_FORMATS = {
  image: {
    supported: ['image/jpeg', 'image/png'],
    convert: ['image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/heic'],
    targetFormat: 'jpeg',
    targetMime: 'image/jpeg'
  },
  video: {
    supported: ['video/mp4', 'video/3gpp'],
    convert: ['video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/avi', 'video/mov'],
    targetFormat: 'mp4',
    targetMime: 'video/mp4'
  },
  audio: {
    supported: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/amr'],
    convert: ['audio/wav', 'audio/x-wav', 'audio/webm', 'audio/flac', 'audio/m4a'],
    targetFormat: 'mp3',
    targetMime: 'audio/mpeg'
  }
};

/**
 * Check if file needs conversion
 */
export function needsConversion(mimeType) {
  for (const type of Object.keys(SUPPORTED_FORMATS)) {
    const format = SUPPORTED_FORMATS[type];
    if (format.supported.includes(mimeType)) {
      return { needs: false, type };
    }
    if (format.convert.includes(mimeType)) {
      return { needs: true, type, targetMime: format.targetMime };
    }
  }
  return { needs: false, type: 'unknown' };
}

/**
 * Convert image to WhatsApp-compatible format
 */
export async function convertImage(inputPath, quality = 90) {
  try {
    const outputPath = inputPath.replace(/\.[^.]+$/, '.jpg');

    await sharp(inputPath)
      .jpeg({
        quality,
        mozjpeg: true // Better compression
      })
      .resize(4096, 4096, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(outputPath);

    logger.info('Image converted:', { inputPath, outputPath });

    return {
      success: true,
      outputPath,
      mimeType: 'image/jpeg'
    };
  } catch (error) {
    logger.error('Image conversion error:', error);
    throw new Error(`Failed to convert image: ${error.message}`);
  }
}

/**
 * Convert video to WhatsApp-compatible format (MP4)
 */
export async function convertVideo(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/\.[^.]+$/, '.mp4');

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264', // H.264 codec
        '-preset fast', // Encoding speed
        '-crf 23', // Quality (lower = better, 23 is good balance)
        '-c:a aac', // AAC audio codec
        '-b:a 128k', // Audio bitrate
        '-movflags +faststart', // Enable streaming
        '-vf scale=1280:720:force_original_aspect_ratio=decrease', // Max 720p
        '-max_muxing_queue_size 9999'
      ])
      .on('start', (command) => {
        logger.info('FFmpeg started:', command);
      })
      .on('progress', (progress) => {
        logger.debug('FFmpeg progress:', progress.percent);
      })
      .on('end', () => {
        logger.info('Video converted:', { inputPath, outputPath });
        resolve({
          success: true,
          outputPath,
          mimeType: 'video/mp4'
        });
      })
      .on('error', (error) => {
        logger.error('FFmpeg error:', error);
        reject(new Error(`Failed to convert video: ${error.message}`));
      })
      .save(outputPath);
  });
}

/**
 * Convert audio to WhatsApp-compatible format (MP3)
 */
export async function convertAudio(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/\.[^.]+$/, '.mp3');

    ffmpeg(inputPath)
      .outputOptions([
        '-c:a libmp3lame', // MP3 codec
        '-b:a 128k', // Bitrate
        '-ar 44100', // Sample rate
        '-ac 2' // Stereo
      ])
      .on('start', (command) => {
        logger.info('FFmpeg audio started:', command);
      })
      .on('end', () => {
        logger.info('Audio converted:', { inputPath, outputPath });
        resolve({
          success: true,
          outputPath,
          mimeType: 'audio/mpeg'
        });
      })
      .on('error', (error) => {
        logger.error('FFmpeg audio error:', error);
        reject(new Error(`Failed to convert audio: ${error.message}`));
      })
      .save(outputPath);
  });
}

/**
 * Main conversion function
 */
export async function convertMedia(inputPath, mimeType, deleteOriginal = true) {
  try {
    const conversionCheck = needsConversion(mimeType);

    if (!conversionCheck.needs) {
      logger.info('No conversion needed:', { mimeType });
      return {
        success: true,
        outputPath: inputPath,
        mimeType,
        converted: false
      };
    }

    let result;

    switch (conversionCheck.type) {
      case 'image':
        result = await convertImage(inputPath);
        break;
      case 'video':
        result = await convertVideo(inputPath);
        break;
      case 'audio':
        result = await convertAudio(inputPath);
        break;
      default:
        throw new Error(`Unsupported media type: ${conversionCheck.type}`);
    }

    // Delete original file if conversion successful
    if (deleteOriginal && result.success && result.outputPath !== inputPath) {
      try {
        await unlinkAsync(inputPath);
        logger.info('Original file deleted:', inputPath);
      } catch (error) {
        logger.warn('Failed to delete original file:', error);
      }
    }

    return {
      ...result,
      converted: true,
      originalMimeType: mimeType
    };
  } catch (error) {
    logger.error('Media conversion error:', error);
    throw error;
  }
}

/**
 * Get media type from mime type
 */
export function getMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('application/')) return 'document';
  return 'unknown';
}

/**
 * Validate file size for WhatsApp
 * WhatsApp limits: Images 5MB, Videos 16MB, Audio 16MB, Documents 100MB
 */
export function validateFileSize(fileSize, mimeType) {
  const type = getMediaType(mimeType);
  const limits = {
    image: 5 * 1024 * 1024, // 5MB
    video: 16 * 1024 * 1024, // 16MB
    audio: 16 * 1024 * 1024, // 16MB
    document: 100 * 1024 * 1024 // 100MB
  };

  const limit = limits[type] || limits.document;

  return {
    valid: fileSize <= limit,
    limit,
    size: fileSize,
    type
  };
}

export default {
  convertMedia,
  convertImage,
  convertVideo,
  convertAudio,
  needsConversion,
  getMediaType,
  validateFileSize
};
