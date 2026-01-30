import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ courseId: string; topicId: string }>;
}

// GET /api/courses/[courseId]/topics/[topicId] - Get a single topic
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId, topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        courseId,
      },
      include: {
        _count: {
          select: { questions: { where: { isArchived: false } } },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[courseId]/topics/[topicId] - Update a topic
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId, topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify topic exists
    const existingTopic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        courseId,
      },
    });

    if (!existingTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Topic name is required' },
        { status: 400 }
      );
    }

    // Check if new name conflicts with another topic in the same course
    if (name.trim() !== existingTopic.name) {
      const conflictingTopic = await prisma.topic.findFirst({
        where: {
          courseId,
          name: name.trim(),
          NOT: { id: topicId },
        },
      });

      if (conflictingTopic) {
        return NextResponse.json(
          { error: 'A topic with this name already exists in this course' },
          { status: 400 }
        );
      }
    }

    const topic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name: name.trim(),
        description: description || null,
        sortOrder: sortOrder ?? existingTopic.sortOrder,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/topics/[topicId] - Delete a topic
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId, topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify topic exists and check for questions
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        courseId,
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // If topic has questions, unassign them from the topic (don't delete questions)
    if (topic._count.questions > 0) {
      await prisma.question.updateMany({
        where: { topicId },
        data: { topicId: null },
      });
    }

    await prisma.topic.delete({
      where: { id: topicId },
    });

    return NextResponse.json({
      message: 'Topic deleted successfully',
      unassignedQuestions: topic._count.questions,
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
