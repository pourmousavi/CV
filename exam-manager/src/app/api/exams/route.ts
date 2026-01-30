import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/exams - List all exams
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course');
    const examTypeId = searchParams.get('type');
    const year = searchParams.get('year');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (courseId) where.courseId = courseId;
    if (examTypeId) where.examTypeId = examTypeId;
    if (year) where.academicYear = parseInt(year);

    const exams = await prisma.exam.findMany({
      where,
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        examType: { select: { id: true, name: true } },
        _count: { select: { examQuestions: true } },
      },
      orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create a new exam
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      courseId,
      examTypeId,
      title,
      academicYear,
      semester,
      instructionsLatex,
      examDate,
      durationMinutes,
    } = body;

    if (!courseId || !examTypeId || !title) {
      return NextResponse.json(
        { error: 'Course, exam type, and title are required' },
        { status: 400 }
      );
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: session.user.id },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify exam type exists
    const examType = await prisma.examType.findUnique({
      where: { id: examTypeId },
    });

    if (!examType) {
      return NextResponse.json({ error: 'Exam type not found' }, { status: 404 });
    }

    const exam = await prisma.exam.create({
      data: {
        userId: session.user.id,
        courseId,
        examTypeId,
        title,
        academicYear: academicYear ? parseInt(academicYear) : null,
        semester: semester || null,
        instructionsLatex: instructionsLatex || null,
        examDate: examDate ? new Date(examDate) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      },
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        examType: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    );
  }
}
