import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ questionId: string }>;
}

// POST /api/questions/[questionId]/duplicate - Duplicate a question
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { questionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the original question
    const original = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: session.user.id,
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        tags: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Create duplicate with parent reference
    const duplicate = await prisma.question.create({
      data: {
        userId: session.user.id,
        courseId: original.courseId,
        topicId: original.topicId,
        parentQuestionId: original.id, // Link to parent for lineage tracking
        questionType: original.questionType,
        difficulty: original.difficulty,
        questionLatex: original.questionLatex,
        solutionLatex: original.solutionLatex,
        answerKey: original.answerKey,
        defaultPoints: original.defaultPoints,
        notes: original.notes
          ? `[Duplicated from parent] ${original.notes}`
          : '[Duplicated from parent question]',
        sourceReference: original.sourceReference,
        // Duplicate options
        options:
          original.options.length > 0
            ? {
                create: original.options.map((opt) => ({
                  label: opt.label,
                  optionLatex: opt.optionLatex,
                  isCorrect: opt.isCorrect,
                  sortOrder: opt.sortOrder,
                })),
              }
            : undefined,
        // Duplicate tag connections
        tags:
          original.tags.length > 0
            ? {
                create: original.tags.map((t) => ({
                  tag: { connect: { id: t.tagId } },
                })),
              }
            : undefined,
        // Note: Images are NOT duplicated - they need to be re-uploaded or shared
      },
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        topic: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        options: { orderBy: { sortOrder: 'asc' } },
        parentQuestion: { select: { id: true, questionLatex: true } },
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error('Error duplicating question:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate question' },
      { status: 500 }
    );
  }
}
