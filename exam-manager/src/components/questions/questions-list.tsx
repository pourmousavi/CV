'use client';

import Link from 'next/link';
import { LaTeXPreview } from '@/components/ui/latex-preview';
import { ClipboardList, Copy, BookOpen } from 'lucide-react';

interface Question {
  id: string;
  questionType: string;
  difficulty: string;
  questionLatex: string;
  course: {
    id: string;
    code: string;
    name: string;
    color: string | null;
  };
  topic: {
    id: string;
    name: string;
  } | null;
  tags: {
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
  _count: {
    examQuestions: number;
  };
}

interface QuestionsListProps {
  questions: Question[];
}

const difficultyStyles: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-red-100 text-red-700',
};

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: 'MC',
  SHORT_ANSWER: 'Short',
  LONG_FORM: 'Long',
  NUMERICAL: 'Num',
};

export function QuestionsList({ questions }: QuestionsListProps) {
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Link
          key={question.id}
          href={`/dashboard/questions/${question.id}`}
          className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            {/* Course badge and type */}
            <div className="flex flex-col gap-2">
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${question.course.color}20`,
                  color: question.course.color || '#3B82F6',
                }}
              >
                {question.course.code}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {typeLabels[question.questionType] || question.questionType}
              </span>
            </div>

            {/* Question content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 line-clamp-3">
                <LaTeXPreview content={question.questionLatex.substring(0, 300)} />
              </div>

              {/* Metadata row */}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {question.topic && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {question.topic.name}
                  </span>
                )}

                {question._count.examQuestions > 0 && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    Used {question._count.examQuestions}x
                  </span>
                )}

                {/* Tags */}
                {question.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {question.tags.slice(0, 3).map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color || '#6B7280',
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {question.tags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{question.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Difficulty badge */}
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                difficultyStyles[question.difficulty] || difficultyStyles.MEDIUM
              }`}
            >
              {question.difficulty.toLowerCase()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
