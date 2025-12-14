import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  /**
   * Check if Cloudinary is configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Upload an image buffer to Cloudinary
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string = 'products',
    publicId?: string
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              width: result.width || 0,
              height: result.height || 0,
              format: result.format || '',
              bytes: result.bytes || 0,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );

      // Convert buffer to stream
      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Upload an image from a base64 string
   */
  static async uploadImageFromBase64(
    base64String: string,
    folder: string = 'products',
    publicId?: string
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64Data}`,
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              width: result.width || 0,
              height: result.height || 0,
              format: result.format || '',
              bytes: result.bytes || 0,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );
    });
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get configuration status
   */
  static getConfig() {
    return {
      configured: this.isConfigured(),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    };
  }
}

export const cloudinaryService = CloudinaryService;

