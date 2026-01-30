import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/questions - List questions with filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course');
    const topicId = searchParams.get('topic');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const archived = searchParams.get('archived') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      userId: session.user.id,
      isArchived: archived,
    };

    if (courseId) where.courseId = courseId;
    if (topicId) where.topicId = topicId;
    if (type) where.questionType = type;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { questionLatex: { contains: search, mode: 'insensitive' } },
        { solutionLatex: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { sourceReference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          course: { select: { id: true, code: true, name: true, color: true } },
          topic: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          options: { orderBy: { sortOrder: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { examQuestions: true, childQuestions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create a new question
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      options, // For multiple choice
      tagIds,
      parentQuestionId, // For duplicated questions
    } = body;

    // Validate required fields
    if (!courseId || !questionType || !questionLatex) {
      return NextResponse.json(
        { error: 'Course, question type, and question content are required' },
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

    // Verify topic if provided
    if (topicId) {
      const topic = await prisma.topic.findFirst({
        where: { id: topicId, courseId },
      });

      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
      }
    }

    // Create question with options and tags
    const question = await prisma.question.create({
      data: {
        userId: session.user.id,
        courseId,
        topicId: topicId || null,
        parentQuestionId: parentQuestionId || null,
        questionType,
        difficulty: difficulty || 'MEDIUM',
        questionLatex,
        solutionLatex: solutionLatex || null,
        answerKey: answerKey || null,
        defaultPoints: defaultPoints ? parseFloat(defaultPoints) : null,
        notes: notes || null,
        sourceReference: sourceReference || null,
        // Create options for multiple choice
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
        // Connect tags
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
        parentQuestion: { select: { id: true, questionLatex: true } },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
