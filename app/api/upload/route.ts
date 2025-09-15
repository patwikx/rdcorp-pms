import { NextRequest, NextResponse } from 'next/server';
import { minioClient, DOCUMENTS_BUCKET, generateFileName, initializeBucket, generatePublicUrl } from '@/lib/minio';

export async function POST(request: NextRequest) {
    try {
      // Initialize bucket if needed
      await initializeBucket();
      
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
  
      // Validate file size (16MB limit)
      const maxSize = 16 * 1024 * 1024; // 16MB
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size exceeds 16MB limit' }, { status: 400 });
      }
  
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'video/mp4',
        'video/webm',
        'video/quicktime',
      ];
  
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
      }
  
      // Generate unique filename
      const fileName = generateFileName(file.name);
      
      // Convert file to buffer
      const buffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);
  
      // Upload to MinIO with proper metadata
      await minioClient.putObject(
        DOCUMENTS_BUCKET,
        fileName,
        fileBuffer,
        file.size,
        {
          'Content-Type': file.type,
          'Content-Disposition': `inline; filename="${file.name}"`,
          'original-filename': file.name,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        }
      );
  
      // Generate the public URL
      const fileUrl = generatePublicUrl(fileName);
  
      return NextResponse.json({
        success: true,
        fileUrl,
        fileName,
        originalName: file.name,
      });
    } catch (error) {
      console.error('Error uploading file to MinIO:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Upload failed' },
        { status: 500 }
      );
    }
}