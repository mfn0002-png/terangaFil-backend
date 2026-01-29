import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_API_KEY) {
  console.warn('⚠️ Cloudinary API Key is missing in CloudinaryService module evaluation!');
} else {
  console.log('✅ Cloudinary correctly configured for:', process.env.CLOUDINARY_CLOUD_NAME);
}

export class CloudinaryService {
  /**
   * Upload an image (base64 or local path) to Cloudinary
   * Returns the secure_url
   */
  async uploadImage(fileStr: string, folder: string = 'teranga-fil'): Promise<string | null> {
    if (!fileStr) return null;
    
    // Check if it's already a URL
    if (fileStr.startsWith('http')) return fileStr;

    try {
      const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder,
        resource_type: 'auto',
      });
      return uploadResponse.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return null;
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(fileStrs: string[], folder: string = 'teranga-fil'): Promise<string[]> {
    if (!fileStrs || fileStrs.length === 0) return [];
    
    const uploadPromises = fileStrs.map(file => this.uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  }
}
