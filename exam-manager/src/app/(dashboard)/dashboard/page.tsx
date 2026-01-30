import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import Link from 'next/link';
import {
  BookOpen,
  FileQuestion,
  ClipboardList,
  TrendingUp,
  Plus,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await requireUser();

  // Get statistics
  const [coursesCount, questionsCount, examsCount, recentQuestions] =
    await Promise.all([
      prisma.course.count({ where: { userId: user.id } }),
      prisma.question.count({
        where: { userId: user.id, isArchived: false },
      }),
      prisma.exam.count({ where: { userId: user.id } }),
      prisma.question.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          course: { select: { name: true, code: true } },
          topic: { select: { name: true } },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s an overview of your exam question bank
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Courses"
          value={coursesCount}
          icon={BookOpen}
          href="/dashboard/courses"
          color="blue"
        />
        <StatCard
          title="Questions"
          value={questionsCount}
          icon={FileQuestion}
          href="/dashboard/questions"
          color="green"
        />
        <StatCard
          title="Exams"
          value={examsCount}
          icon={ClipboardList}
          href="/dashboard/exams"
          color="purple"
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionButton
            href="/dashboard/questions/new"
            icon={Plus}
            label="New Question"
          />
          <QuickActionButton
            href="/dashboard/exams/new"
            icon={Plus}
            label="New Exam"
          />
          <QuickActionButton
            href="/dashboard/courses/new"
            icon={Plus}
            label="New Course"
          />
        </div>
      </div>

      {/* Recent questions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Questions
          </h2>
          <Link
            href="/dashboard/questions"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {recentQuestions.length === 0 ? (
          <div className="text-center py-8">
            <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">No questions yet</p>
            <Link
              href="/dashboard/questions/new"
              className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create your first question
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentQuestions.map((question) => (
              <Link
                key={question.id}
                href={`/dashboard/questions/${question.id}`}
                className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {question.questionLatex.substring(0, 150)}
                      {question.questionLatex.length > 150 ? '...' : ''}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">
                        {question.course.code}
                      </span>
                      {question.topic && (
                        <>
                          <span>/</span>
                          <span>{question.topic.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <DifficultyBadge difficulty={question.difficulty} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: number;
  icon: typeof TrendingUp;
  href: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Link>
  );
}

function QuickActionButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Plus;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles = {
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        styles[difficulty as keyof typeof styles] || styles.MEDIUM
      }`}
    >
      {difficulty.toLowerCase()}
    </span>
  );
}
