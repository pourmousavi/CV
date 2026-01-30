import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// GET /api/exams/[examId] - Get a single exam with questions
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId: session.user.id,
      },
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        examType: { select: { id: true, name: true } },
        examQuestions: {
          orderBy: { questionOrder: 'asc' },
          include: {
            question: {
              include: {
                topic: { select: { id: true, name: true } },
                options: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Calculate total points
    const totalPoints = exam.examQuestions.reduce(
      (sum, eq) => sum + (eq.pointsAssigned ? Number(eq.pointsAssigned) : 0),
      0
    );

    return NextResponse.json({ ...exam, calculatedTotalPoints: totalPoints });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

// PUT /api/exams/[examId] - Update an exam
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId: session.user.id,
      },
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
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
      totalPoints,
    } = body;

    // Verify course if changing
    if (courseId && courseId !== existingExam.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: courseId, userId: session.user.id },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
    }

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        courseId: courseId || undefined,
        examTypeId: examTypeId || undefined,
        title: title || undefined,
        academicYear: academicYear !== undefined
          ? (academicYear ? parseInt(academicYear) : null)
          : undefined,
        semester: semester !== undefined ? (semester || null) : undefined,
        instructionsLatex: instructionsLatex !== undefined
          ? (instructionsLatex || null)
          : undefined,
        examDate: examDate !== undefined
          ? (examDate ? new Date(examDate) : null)
          : undefined,
        durationMinutes: durationMinutes !== undefined
          ? (durationMinutes ? parseInt(durationMinutes) : null)
          : undefined,
        totalPoints: totalPoints !== undefined
          ? (totalPoints ? parseFloat(totalPoints) : null)
          : undefined,
      },
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        examType: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[examId] - Delete an exam
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId: session.user.id,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Delete exam (cascades to exam_questions)
    await prisma.exam.delete({
      where: { id: examId },
    });

    return NextResponse.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
