import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/courses - List all courses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: {
            topics: true,
            questions: { where: { isArchived: false } },
            exams: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, description, color } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Course code and name are required' },
        { status: 400 }
      );
    }

    // Check if course code already exists for this user
    const existingCourse = await prisma.course.findFirst({
      where: {
        userId: session.user.id,
        code: code.toUpperCase(),
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with this code already exists' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        userId: session.user.id,
        code: code.toUpperCase(),
        name,
        description: description || null,
        color: color || '#3B82F6',
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
