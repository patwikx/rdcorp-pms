// app/api/minio/presigned-url/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/lib/minio';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'File name is required' }, { status: 400 });
    }

    const url = await generatePresignedUrl(fileName);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('API Error generating pre-signed URL:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate URL' }, { status: 500 });
  }
}