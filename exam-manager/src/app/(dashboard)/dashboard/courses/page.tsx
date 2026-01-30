import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Plus, BookOpen, FileQuestion, ClipboardList, FolderOpen } from 'lucide-react';

export default async function CoursesPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          topics: true,
          questions: { where: { isArchived: false } },
          exams: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">
            Manage your courses and their topics
          </p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No courses yet
          </h3>
          <p className="mt-2 text-gray-600">
            Create your first course to start organizing your exam questions.
          </p>
          <Link
            href="/dashboard/courses/new"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${course.color}20` }}
                >
                  <BookOpen
                    className="h-6 w-6"
                    style={{ color: course.color || '#3B82F6' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${course.color}20`,
                        color: course.color || '#3B82F6',
                      }}
                    >
                      {course.code}
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold text-gray-900 truncate">
                    {course.name}
                  </h3>
                  {course.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FolderOpen className="h-4 w-4" />
                  <span>{course._count.topics} topics</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileQuestion className="h-4 w-4" />
                  <span>{course._count.questions} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  <span>{course._count.exams} exams</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
