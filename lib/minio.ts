import { Client } from 'minio';

// MinIO client configuration
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 's3-api.rdrealty.com.ph',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

// Bucket name for documents
export const DOCUMENTS_BUCKET = process.env.MINIO_DOCUMENTS_BUCKET || 'pms-bucket';

// Initialize bucket with public read policy
export async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(DOCUMENTS_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(DOCUMENTS_BUCKET);
      console.log(`Bucket ${DOCUMENTS_BUCKET} created successfully.`);
      
      // Set public read policy for the bucket
      const publicReadPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${DOCUMENTS_BUCKET}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(DOCUMENTS_BUCKET, JSON.stringify(publicReadPolicy));
      console.log(`Public read policy set for bucket ${DOCUMENTS_BUCKET}`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
  }
}

// Generate a unique filename
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${randomStr}.${ext}`;
}

// Generate public URL for uploaded files
export function generatePublicUrl(fileName: string): string {
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const port = process.env.MINIO_PORT && process.env.MINIO_PORT !== '80' && process.env.MINIO_PORT !== '443' 
    ? `:${process.env.MINIO_PORT}` 
    : '';
  
  return `${protocol}://${process.env.MINIO_ENDPOINT}${port}/${DOCUMENTS_BUCKET}/${fileName}`;
}

/**
 * Generates a secure, temporary URL to access a private file.
 * (Keep this for cases where you need temporary access)
 */
export async function generatePresignedUrl(fileName: string): Promise<string> {
  try {
    const expiryInSeconds = 5 * 60;
    const url = await minioClient.presignedGetObject(
      DOCUMENTS_BUCKET,
      fileName,
      expiryInSeconds
    );
    return url;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw new Error('Could not generate URL for the requested file.');
  }
}