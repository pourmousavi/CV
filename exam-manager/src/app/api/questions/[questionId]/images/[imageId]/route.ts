import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: Promise<{ questionId: string; imageId: string }>;
}

// GET - Get single image details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { questionId, imageId } = await params;

    const image = await prisma.questionImage.findFirst({
      where: {
        id: imageId,
        questionId,
        question: {
          userId: user.id,
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

// PATCH - Update image caption
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { questionId, imageId } = await params;

    // Verify ownership
    const existingImage = await prisma.questionImage.findFirst({
      where: {
        id: imageId,
        questionId,
        question: {
          userId: user.id,
        },
      },
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { caption } = body as { caption?: string };

    const image = await prisma.questionImage.update({
      where: { id: imageId },
      data: { caption: caption || null },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { questionId, imageId } = await params;

    // Verify ownership and get filepath
    const image = await prisma.questionImage.findFirst({
      where: {
        id: imageId,
        questionId,
        question: {
          userId: user.id,
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const fullPath = path.join(process.cwd(), image.filepath);
      await unlink(fullPath);
    } catch (fsError) {
      // Log but don't fail if file doesn't exist
      console.warn('Could not delete file:', fsError);
    }

    // Delete database record
    await prisma.questionImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
