import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Plus, FileQuestion } from 'lucide-react';
import { QuestionsList } from '@/components/questions/questions-list';
import { QuestionsFilters } from '@/components/questions/questions-filters';

interface PageProps {
  searchParams: Promise<{
    course?: string;
    topic?: string;
    type?: string;
    difficulty?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const page = parseInt(params.page || '1');
  const limit = 20;

  // Build filter conditions
  const where: Record<string, unknown> = {
    userId: user.id,
    isArchived: false,
  };

  if (params.course) where.courseId = params.course;
  if (params.topic) where.topicId = params.topic;
  if (params.type) where.questionType = params.type;
  if (params.difficulty) where.difficulty = params.difficulty;
  if (params.search) {
    where.OR = [
      { questionLatex: { contains: params.search, mode: 'insensitive' } },
      { solutionLatex: { contains: params.search, mode: 'insensitive' } },
      { notes: { contains: params.search, mode: 'insensitive' } },
      { sourceReference: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  // Fetch questions and filter options in parallel
  const [questionsResult, courses, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        topic: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        _count: { select: { examQuestions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.course.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        color: true,
        topics: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true },
        },
      },
    }),
    prisma.question.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">
            {total} question{total !== 1 && 's'} in your bank
          </p>
        </div>
        <Link
          href="/dashboard/questions/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Question
        </Link>
      </div>

      {/* Filters */}
      <QuestionsFilters
        courses={courses}
        currentFilters={{
          course: params.course,
          topic: params.topic,
          type: params.type,
          difficulty: params.difficulty,
          search: params.search,
        }}
      />

      {/* Questions list */}
      {questionsResult.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {params.search || params.course || params.topic || params.type || params.difficulty
              ? 'No questions match your filters'
              : 'No questions yet'}
          </h3>
          <p className="mt-2 text-gray-600">
            {params.search || params.course || params.topic || params.type || params.difficulty
              ? 'Try adjusting your filters or search term'
              : 'Create your first question to get started'}
          </p>
          {!params.search && !params.course && !params.topic && !params.type && !params.difficulty && (
            <Link
              href="/dashboard/questions/new"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Question
            </Link>
          )}
        </div>
      ) : (
        <>
          <QuestionsList questions={questionsResult} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={{
                    pathname: '/dashboard/questions',
                    query: { ...params, page: page - 1 },
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Previous
                </Link>
              )}

              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>

              {page < totalPages && (
                <Link
                  href={{
                    pathname: '/dashboard/questions',
                    query: { ...params, page: page + 1 },
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
