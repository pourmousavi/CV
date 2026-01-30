import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/topics - List all topics for a course
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId } = await params;

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

    const topics = await prisma.topic.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { questions: { where: { isArchived: false } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/topics - Create a new topic
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId } = await params;

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

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Topic name is required' },
        { status: 400 }
      );
    }

    // Check if topic name already exists in this course
    const existingTopic = await prisma.topic.findFirst({
      where: {
        courseId,
        name: name.trim(),
      },
    });

    if (existingTopic) {
      return NextResponse.json(
        { error: 'A topic with this name already exists in this course' },
        { status: 400 }
      );
    }

    // Get the highest sort order
    const lastTopic = await prisma.topic.findFirst({
      where: { courseId },
      orderBy: { sortOrder: 'desc' },
    });

    const topic = await prisma.topic.create({
      data: {
        courseId,
        name: name.trim(),
        description: description || null,
        sortOrder: (lastTopic?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
