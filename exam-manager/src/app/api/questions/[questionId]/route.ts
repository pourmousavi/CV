import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ questionId: string }>;
}

// GET /api/questions/[questionId] - Get a single question
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { questionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: session.user.id,
      },
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        topic: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        options: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        parentQuestion: {
          select: {
            id: true,
            questionLatex: true,
            createdAt: true,
          },
        },
        childQuestions: {
          select: {
            id: true,
            questionLatex: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        examQuestions: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                academicYear: true,
                semester: true,
                examDate: true,
                examType: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[questionId] - Update a question
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { questionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingQuestion = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: session.user.id,
      },
      include: { options: true, tags: true },
    });

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      courseId,
      topicId,
      questionType,
      difficulty,
      questionLatex,
      solutionLatex,
      answerKey,
      defaultPoints,
      notes,
      sourceReference,
      options,
      tagIds,
      isArchived,
    } = body;

    // Verify course ownership if changing course
    if (courseId && courseId !== existingQuestion.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: courseId, userId: session.user.id },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
    }

    // Verify topic if provided
    if (topicId) {
      const topic = await prisma.topic.findFirst({
        where: { id: topicId, courseId: courseId || existingQuestion.courseId },
      });

      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
      }
    }

    // Update question in a transaction
    const question = await prisma.$transaction(async (tx) => {
      // Delete existing options if updating multiple choice
      if (questionType === 'MULTIPLE_CHOICE' && options) {
        await tx.questionOption.deleteMany({
          where: { questionId },
        });
      }

      // Delete existing tag connections
      if (tagIds !== undefined) {
        await tx.questionTag.deleteMany({
          where: { questionId },
        });
      }

      // Update question
      return tx.question.update({
        where: { id: questionId },
        data: {
          courseId: courseId || undefined,
          topicId: topicId === null ? null : topicId || undefined,
          questionType: questionType || undefined,
          difficulty: difficulty || undefined,
          questionLatex: questionLatex || undefined,
          solutionLatex: solutionLatex === null ? null : solutionLatex || undefined,
          answerKey: answerKey === null ? null : answerKey || undefined,
          defaultPoints:
            defaultPoints === null
              ? null
              : defaultPoints
              ? parseFloat(defaultPoints)
              : undefined,
          notes: notes === null ? null : notes || undefined,
          sourceReference:
            sourceReference === null ? null : sourceReference || undefined,
          isArchived: isArchived !== undefined ? isArchived : undefined,
          // Create new options
          options:
            questionType === 'MULTIPLE_CHOICE' && options?.length > 0
              ? {
                  create: options.map(
                    (opt: { label: string; optionLatex: string; isCorrect: boolean }, index: number) => ({
                      label: opt.label,
                      optionLatex: opt.optionLatex,
                      isCorrect: opt.isCorrect || false,
                      sortOrder: index,
                    })
                  ),
                }
              : undefined,
          // Connect new tags
          tags:
            tagIds?.length > 0
              ? {
                  create: tagIds.map((tagId: string) => ({
                    tag: { connect: { id: tagId } },
                  })),
                }
              : undefined,
        },
        include: {
          course: { select: { id: true, code: true, name: true, color: true } },
          topic: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          options: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[questionId] - Delete a question
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { questionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership and check usage
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: session.user.id,
      },
      include: {
        _count: { select: { examQuestions: true } },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Warn if used in exams
    if (question._count.examQuestions > 0) {
      return NextResponse.json(
        {
          error: `This question is used in ${question._count.examQuestions} exam(s). Archive it instead or remove it from exams first.`,
        },
        { status: 400 }
      );
    }

    // Delete question (cascades to options, tags, images)
    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
