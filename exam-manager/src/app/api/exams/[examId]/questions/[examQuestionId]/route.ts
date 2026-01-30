import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ examId: string; examQuestionId: string }>;
}

// PUT /api/exams/[examId]/questions/[examQuestionId] - Update exam question (points, performance)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { examId, examQuestionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify exam ownership
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId: session.user.id,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Verify exam question exists
    const existingExamQuestion = await prisma.examQuestion.findFirst({
      where: {
        id: examQuestionId,
        examId,
      },
    });

    if (!existingExamQuestion) {
      return NextResponse.json(
        { error: 'Exam question not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      pointsAssigned,
      averageScore,
      stdDeviation,
      minScore,
      maxScore,
      responseCount,
      performanceNotes,
    } = body;

    const examQuestion = await prisma.examQuestion.update({
      where: { id: examQuestionId },
      data: {
        pointsAssigned: pointsAssigned !== undefined
          ? (pointsAssigned ? parseFloat(pointsAssigned) : null)
          : undefined,
        averageScore: averageScore !== undefined
          ? (averageScore ? parseFloat(averageScore) : null)
          : undefined,
        stdDeviation: stdDeviation !== undefined
          ? (stdDeviation ? parseFloat(stdDeviation) : null)
          : undefined,
        minScore: minScore !== undefined
          ? (minScore ? parseFloat(minScore) : null)
          : undefined,
        maxScore: maxScore !== undefined
          ? (maxScore ? parseFloat(maxScore) : null)
          : undefined,
        responseCount: responseCount !== undefined
          ? (responseCount ? parseInt(responseCount) : null)
          : undefined,
        performanceNotes: performanceNotes !== undefined
          ? (performanceNotes || null)
          : undefined,
      },
      include: {
        question: {
          include: {
            topic: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(examQuestion);
  } catch (error) {
    console.error('Error updating exam question:', error);
    return NextResponse.json(
      { error: 'Failed to update exam question' },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[examId]/questions/[examQuestionId] - Remove question from exam
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { examId, examQuestionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify exam ownership
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId: session.user.id,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Verify exam question exists
    const examQuestion = await prisma.examQuestion.findFirst({
      where: {
        id: examQuestionId,
        examId,
      },
    });

    if (!examQuestion) {
      return NextResponse.json(
        { error: 'Exam question not found' },
        { status: 404 }
      );
    }

    // Delete the exam question
    await prisma.examQuestion.delete({
      where: { id: examQuestionId },
    });

    // Reorder remaining questions
    const remainingQuestions = await prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { questionOrder: 'asc' },
    });

    await prisma.$transaction(
      remainingQuestions.map((eq, index) =>
        prisma.examQuestion.update({
          where: { id: eq.id },
          data: { questionOrder: index + 1 },
        })
      )
    );

    return NextResponse.json({ message: 'Question removed from exam' });
  } catch (error) {
    console.error('Error removing question from exam:', error);
    return NextResponse.json(
      { error: 'Failed to remove question from exam' },
      { status: 500 }
    );
  }
}
