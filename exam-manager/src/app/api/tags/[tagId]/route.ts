import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ tagId: string }>;
}

// GET - Get a single tag
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUser();
    const { tagId } = await params;

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}

// PUT - Update a tag
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUser();
    const { tagId } = await params;

    const body = await request.json();
    const { name, color } = body as { name?: string; color?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check tag exists
    const existing = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current tag)
    const duplicate = await prisma.tag.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: tagId },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name: name.trim(),
        color: color || null,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUser();
    const { tagId } = await params;

    // Check tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Delete the tag (QuestionTag relations will be cascade deleted)
    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true, questionsAffected: tag._count.questions });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
