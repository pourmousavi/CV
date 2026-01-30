import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Plus, ClipboardList, FileQuestion, Calendar, Clock } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function ExamsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const where: Record<string, unknown> = {
    userId: user.id,
  };

  if (params.course) where.courseId = params.course;

  const [exams, courses, examTypes] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: {
        course: { select: { id: true, code: true, name: true, color: true } },
        examType: { select: { id: true, name: true } },
        _count: { select: { examQuestions: true } },
      },
      orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.course.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.examType.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  // Group exams by year
  const examsByYear = exams.reduce((acc, exam) => {
    const year = exam.academicYear || 'Undated';
    if (!acc[year]) acc[year] = [];
    acc[year].push(exam);
    return acc;
  }, {} as Record<string | number, typeof exams>);

  const years = Object.keys(examsByYear).sort((a, b) => {
    if (a === 'Undated') return 1;
    if (b === 'Undated') return -1;
    return Number(b) - Number(a);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your exams
          </p>
        </div>
        <Link
          href="/dashboard/exams/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Exam
        </Link>
      </div>

      {/* Filters */}
      {courses.length > 0 && (
        <div className="flex gap-4">
          <Link
            href="/dashboard/exams"
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !params.course
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Courses
          </Link>
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/exams?course=${course.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                params.course === course.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {course.code}
            </Link>
          ))}
        </div>
      )}

      {/* Exams list */}
      {exams.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No exams yet
          </h3>
          <p className="mt-2 text-gray-600">
            Create your first exam to start building question sets.
          </p>
          <Link
            href="/dashboard/exams/new"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Exam
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <div key={year}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {year}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {examsByYear[year].map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/dashboard/exams/${exam.id}`}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${exam.course.color}20` }}
                      >
                        <ClipboardList
                          className="h-5 w-5"
                          style={{ color: exam.course.color || '#3B82F6' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${exam.course.color}20`,
                              color: exam.course.color || '#3B82F6',
                            }}
                          >
                            {exam.course.code}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {exam.examType.name}
                          </span>
                        </div>
                        <h3 className="mt-1 font-medium text-gray-900 truncate">
                          {exam.title}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileQuestion className="h-4 w-4" />
                        {exam._count.examQuestions} questions
                      </span>
                      {exam.examDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(exam.examDate).toLocaleDateString()}
                        </span>
                      )}
                      {exam.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {exam.durationMinutes}m
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
