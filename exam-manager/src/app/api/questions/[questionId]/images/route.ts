import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface RouteParams {
  params: Promise<{ questionId: string }>;
}

// GET - List all images for a question
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { questionId } = await params;

    // Verify question belongs to user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: user.id,
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(question.images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST - Upload a new image
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { questionId } = await params;

    // Verify question belongs to user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: user.id,
      },
      include: {
        images: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`;
    const filename = `${randomUUID()}${ext}`;

    // Create uploads directory structure
    const uploadsDir = path.join(process.cwd(), 'uploads', 'questions', questionId);
    await mkdir(uploadsDir, { recursive: true });

    // Save file
    const filePath = path.join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Store relative path for portability
    const storedPath = `/uploads/questions/${questionId}/${filename}`;

    // Get next sort order
    const nextSortOrder = question.images.length > 0
      ? Math.max(...question.images.map(img => img.sortOrder)) + 1
      : 0;

    // Create database record
    const image = await prisma.questionImage.create({
      data: {
        questionId,
        filename: file.name,
        filepath: storedPath,
        mimeType: file.type,
        fileSize: file.size,
        caption: caption || null,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// PATCH - Reorder images
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { questionId } = await params;

    // Verify question belongs to user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: user.id,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { imageIds } = body as { imageIds: string[] };

    if (!Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'imageIds must be an array' },
        { status: 400 }
      );
    }

    // Update sort order for each image
    await prisma.$transaction(
      imageIds.map((id, index) =>
        prisma.questionImage.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering images:', error);
    return NextResponse.json(
      { error: 'Failed to reorder images' },
      { status: 500 }
    );
  }
}
