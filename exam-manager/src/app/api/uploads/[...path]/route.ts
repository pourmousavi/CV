import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { readFile, stat } from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

// GET - Serve uploaded files
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { path: pathSegments } = await params;

    // Reconstruct the path
    const relativePath = pathSegments.join('/');

    // Only allow serving from uploads directory
    if (!relativePath.startsWith('questions/')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Extract questionId from path (uploads/questions/{questionId}/filename)
    const questionId = pathSegments[1];

    // Verify user owns this question
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: user.id,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Build full path and validate it's within uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const fullPath = path.join(uploadsDir, relativePath);
    const normalizedPath = path.normalize(fullPath);

    // Prevent directory traversal attacks
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check if file exists
    try {
      await stat(normalizedPath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read and serve file
    const fileBuffer = await readFile(normalizedPath);

    // Determine content type from extension
    const ext = path.extname(normalizedPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
