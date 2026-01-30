import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// POST /api/exams/[examId]/questions - Add a question to an exam
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify exam ownership
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId: session.user.id,
      },
      include: {
        examQuestions: { orderBy: { questionOrder: 'desc' }, take: 1 },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const body = await request.json();
    const { questionId, pointsAssigned } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Verify question ownership
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: session.user.id,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if question is already in exam
    const existingEntry = await prisma.examQuestion.findFirst({
      where: { examId, questionId },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Question is already in this exam' },
        { status: 400 }
      );
    }

    // Get next question order
    const nextOrder = (exam.examQuestions[0]?.questionOrder ?? 0) + 1;

    const examQuestion = await prisma.examQuestion.create({
      data: {
        examId,
        questionId,
        questionOrder: nextOrder,
        pointsAssigned: pointsAssigned
          ? parseFloat(pointsAssigned)
          : question.defaultPoints,
      },
      include: {
        question: {
          include: {
            topic: { select: { id: true, name: true } },
            options: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json(examQuestion, { status: 201 });
  } catch (error) {
    console.error('Error adding question to exam:', error);
    return NextResponse.json(
      { error: 'Failed to add question to exam' },
      { status: 500 }
    );
  }
}

// PUT /api/exams/[examId]/questions - Reorder questions
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { examId } = await params;

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

    const body = await request.json();
    const { questionOrder } = body; // Array of { examQuestionId, order }

    if (!Array.isArray(questionOrder)) {
      return NextResponse.json(
        { error: 'questionOrder must be an array' },
        { status: 400 }
      );
    }

    // Update all orders in a transaction
    await prisma.$transaction(
      questionOrder.map(({ examQuestionId, order }: { examQuestionId: string; order: number }) =>
        prisma.examQuestion.update({
          where: { id: examQuestionId },
          data: { questionOrder: order },
        })
      )
    );

    return NextResponse.json({ message: 'Question order updated' });
  } catch (error) {
    console.error('Error reordering questions:', error);
    return NextResponse.json(
      { error: 'Failed to reorder questions' },
      { status: 500 }
    );
  }
}
