import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId] - Get a single course
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      include: {
        topics: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { questions: { where: { isArchived: false } } },
            },
          },
        },
        _count: {
          select: {
            questions: { where: { isArchived: false } },
            exams: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[courseId] - Update a course
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const body = await request.json();
    const { code, name, description, color } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Course code and name are required' },
        { status: 400 }
      );
    }

    // Check if new code conflicts with another course
    if (code.toUpperCase() !== existingCourse.code) {
      const conflictingCourse = await prisma.course.findFirst({
        where: {
          userId: session.user.id,
          code: code.toUpperCase(),
          NOT: { id: courseId },
        },
      });

      if (conflictingCourse) {
        return NextResponse.json(
          { error: 'A course with this code already exists' },
          { status: 400 }
        );
      }
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        code: code.toUpperCase(),
        name,
        description: description || null,
        color: color || '#3B82F6',
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId] - Delete a course
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { questions: true, exams: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Warn if course has questions or exams
    if (course._count.questions > 0 || course._count.exams > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete course with ${course._count.questions} questions and ${course._count.exams} exams. Delete or move them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
