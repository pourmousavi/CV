import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Plus,
  FolderOpen,
  FileQuestion,
  ClipboardList,
  Trash2,
} from 'lucide-react';
import { DeleteCourseButton } from '@/components/courses/delete-course-button';
import { TopicList } from '@/components/courses/topic-list';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { courseId } = await params;

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId: user.id,
    },
    include: {
      topics: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { questions: { where: { isArchived: false } } },
          },
        },
      },
      _count: {
        select: {
          questions: { where: { isArchived: false } },
          exams: true,
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/courses"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${course.color}20` }}
          >
            <FolderOpen
              className="h-8 w-8"
              style={{ color: course.color || '#3B82F6' }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-sm font-medium"
                style={{
                  backgroundColor: `${course.color}20`,
                  color: course.color || '#3B82F6',
                }}
              >
                {course.code}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {course.name}
            </h1>
            {course.description && (
              <p className="mt-1 text-gray-600">{course.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/courses/${course.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <DeleteCourseButton
            courseId={course.id}
            courseName={course.name}
            questionCount={course._count.questions}
            examCount={course._count.exams}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Topics</p>
              <p className="text-xl font-bold text-gray-900">
                {course.topics.length}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/questions?course=${course.id}`}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <FileQuestion className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Questions</p>
              <p className="text-xl font-bold text-gray-900">
                {course._count.questions}
              </p>
            </div>
          </div>
        </Link>
        <Link
          href={`/dashboard/exams?course=${course.id}`}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <ClipboardList className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Exams</p>
              <p className="text-xl font-bold text-gray-900">
                {course._count.exams}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Topics section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Topics</h2>
          <Link
            href={`/dashboard/courses/${course.id}/topics/new`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Topic
          </Link>
        </div>

        <TopicList courseId={course.id} topics={course.topics} />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/questions/new?course=${course.id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Question
          </Link>
          <Link
            href={`/dashboard/exams/new?course=${course.id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Exam
          </Link>
        </div>
      </div>
    </div>
  );
}
