import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Download,
  Plus,
  Calendar,
  Clock,
  FileQuestion,
  Trash2,
} from 'lucide-react';
import { LaTeXPreview } from '@/components/ui/latex-preview';
import { ExamQuestionList } from '@/components/exams/exam-question-list';
import { AddQuestionModal } from '@/components/exams/add-question-modal';
import { ExportButton } from '@/components/exams/export-button';
import { DeleteExamButton } from '@/components/exams/delete-exam-button';

interface PageProps {
  params: Promise<{ examId: string }>;
}

export default async function ExamDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { examId } = await params;

  const exam = await prisma.exam.findFirst({
    where: {
      id: examId,
      userId: user.id,
    },
    include: {
      course: { select: { id: true, code: true, name: true, color: true } },
      examType: { select: { id: true, name: true } },
      examQuestions: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            include: {
              topic: { select: { id: true, name: true } },
              options: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  // Get available questions for adding (same course, not already in exam)
  const existingQuestionIds = exam.examQuestions.map((eq) => eq.questionId);
  const availableQuestions = await prisma.question.findMany({
    where: {
      userId: user.id,
      courseId: exam.courseId,
      isArchived: false,
      id: { notIn: existingQuestionIds },
    },
    include: {
      topic: { select: { id: true, name: true } },
    },
    orderBy: [{ topic: { sortOrder: 'asc' } }, { createdAt: 'desc' }],
  });

  // Calculate total points
  const totalPoints = exam.examQuestions.reduce(
    (sum, eq) => sum + (eq.pointsAssigned ? Number(eq.pointsAssigned) : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/exams"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-1 rounded text-sm font-medium"
              style={{
                backgroundColor: `${exam.course.color}20`,
                color: exam.course.color || '#3B82F6',
              }}
            >
              {exam.course.code}
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {exam.examType.name}
            </span>
            {exam.academicYear && (
              <span className="text-sm text-gray-500">
                {exam.academicYear} {exam.semester}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{exam.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton examId={exam.id} examTitle={exam.title} />
          <Link
            href={`/dashboard/exams/${exam.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <DeleteExamButton examId={exam.id} examTitle={exam.title} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <FileQuestion className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Questions</p>
              <p className="text-xl font-bold text-gray-900">
                {exam.examQuestions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <span className="text-green-600 text-lg font-bold">Σ</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-xl font-bold text-gray-900">{totalPoints}</p>
            </div>
          </div>
        </div>

        {exam.examDate && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(exam.examDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {exam.durationMinutes && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-bold text-gray-900">
                  {exam.durationMinutes} min
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {exam.instructionsLatex && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Instructions
          </h2>
          <div className="prose prose-sm max-w-none">
            <LaTeXPreview content={exam.instructionsLatex} />
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Questions ({exam.examQuestions.length})
          </h2>
          <AddQuestionModal
            examId={exam.id}
            availableQuestions={availableQuestions}
          />
        </div>

        <ExamQuestionList examId={exam.id} examQuestions={exam.examQuestions} />
      </div>
    </div>
  );
}
