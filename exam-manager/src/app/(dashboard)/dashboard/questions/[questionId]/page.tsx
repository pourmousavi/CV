import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  BookOpen,
  ClipboardList,
  GitBranch,
  Calendar,
  Award,
  ImageIcon,
} from 'lucide-react';
import { LaTeXPreview } from '@/components/ui/latex-preview';
import { DuplicateButton } from '@/components/questions/duplicate-button';
import { DeleteQuestionButton } from '@/components/questions/delete-question-button';

interface PageProps {
  params: Promise<{ questionId: string }>;
}

const difficultyStyles: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-red-100 text-red-700',
};

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  SHORT_ANSWER: 'Short Answer',
  LONG_FORM: 'Long Form / Proof',
  NUMERICAL: 'Numerical',
};

export default async function QuestionDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { questionId } = await params;

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      userId: user.id,
    },
    include: {
      course: { select: { id: true, code: true, name: true, color: true } },
      topic: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      options: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      parentQuestion: {
        select: { id: true, questionLatex: true, createdAt: true },
      },
      childQuestions: {
        select: { id: true, questionLatex: true, createdAt: true },
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
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/questions"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to questions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-1 rounded text-sm font-medium"
              style={{
                backgroundColor: `${question.course.color}20`,
                color: question.course.color || '#3B82F6',
              }}
            >
              {question.course.code}
            </span>
            {question.topic && (
              <span className="text-sm text-gray-500">/ {question.topic.name}</span>
            )}
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {typeLabels[question.questionType]}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                difficultyStyles[question.difficulty]
              }`}
            >
              {question.difficulty.toLowerCase()}
            </span>
          </div>

          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              {question.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color || '#6B7280',
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DuplicateButton questionId={question.id} />
          <Link
            href={`/dashboard/questions/${question.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <DeleteQuestionButton
            questionId={question.id}
            examCount={question.examQuestions.length}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Question</h2>
        <div className="prose prose-sm max-w-none">
          <LaTeXPreview content={question.questionLatex} />
        </div>

        {/* Multiple choice options */}
        {question.questionType === 'MULTIPLE_CHOICE' && question.options.length > 0 && (
          <div className="mt-6 space-y-3">
            {question.options.map((option) => (
              <div
                key={option.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    option.isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {option.label}
                </span>
                <div className="flex-1">
                  <LaTeXPreview content={option.optionLatex} />
                </div>
                {option.isCorrect && (
                  <span className="text-xs font-medium text-green-600">Correct</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Answer key for non-MC */}
        {question.questionType !== 'MULTIPLE_CHOICE' && question.answerKey && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Answer Key</h3>
            <p className="text-blue-800">{question.answerKey}</p>
          </div>
        )}

        {/* Images */}
        {question.images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Attached Images ({question.images.length})
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {question.images.map((image) => (
                <div
                  key={image.id}
                  className="rounded-lg border border-gray-200 overflow-hidden"
                >
                  <img
                    src={`/api${image.filepath}`}
                    alt={image.caption || image.filename}
                    className="w-full h-48 object-contain bg-gray-50"
                  />
                  {image.caption && (
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Solution */}
      {question.solutionLatex && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Solution</h2>
          <div className="prose prose-sm max-w-none">
            <LaTeXPreview content={question.solutionLatex} />
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>
          <dl className="space-y-3 text-sm">
            {question.defaultPoints && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Default Points</dt>
                <dd className="font-medium">{question.defaultPoints.toString()}</dd>
              </div>
            )}
            {question.sourceReference && (
              <div>
                <dt className="text-gray-500 mb-1">Source</dt>
                <dd className="text-gray-900">{question.sourceReference}</dd>
              </div>
            )}
            {question.notes && (
              <div>
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="text-gray-900 whitespace-pre-wrap">{question.notes}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd>{new Date(question.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Last Updated</dt>
              <dd>{new Date(question.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Question Lineage */}
        {(question.parentQuestion || question.childQuestions.length > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Question History
            </h2>

            {question.parentQuestion && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Derived from:</p>
                <Link
                  href={`/dashboard/questions/${question.parentQuestion.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {question.parentQuestion.questionLatex.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(question.parentQuestion.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              </div>
            )}

            {question.childQuestions.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Variations ({question.childQuestions.length}):
                </p>
                <div className="space-y-2">
                  {question.childQuestions.map((child) => (
                    <Link
                      key={child.id}
                      href={`/dashboard/questions/${child.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm text-gray-900 line-clamp-1">
                        {child.questionLatex.substring(0, 80)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(child.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage History */}
      {question.examQuestions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Used in Exams ({question.examQuestions.length})
          </h2>

          <div className="space-y-3">
            {question.examQuestions.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{eq.exam.title}</p>
                  <p className="text-sm text-gray-500">
                    {eq.exam.examType.name}
                    {eq.exam.academicYear && ` - ${eq.exam.academicYear}`}
                    {eq.exam.semester && ` ${eq.exam.semester}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  {eq.pointsAssigned && (
                    <p className="font-medium">{eq.pointsAssigned.toString()} pts</p>
                  )}
                  {eq.averageScore !== null && (
                    <p className="text-gray-500">
                      Avg: {eq.averageScore.toString()}
                      {eq.stdDeviation && ` (SD: ${eq.stdDeviation.toString()})`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
