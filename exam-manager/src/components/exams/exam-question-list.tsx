'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GripVertical, Trash2, BarChart3, Loader2 } from 'lucide-react';
import { LaTeXPreview } from '@/components/ui/latex-preview';
import { PerformanceModal } from '@/components/exams/performance-modal';

interface ExamQuestion {
  id: string;
  questionOrder: number;
  pointsAssigned: number | null;
  averageScore: number | null;
  stdDeviation: number | null;
  question: {
    id: string;
    questionType: string;
    difficulty: string;
    questionLatex: string;
    topic: { id: string; name: string } | null;
    options: { label: string; optionLatex: string; isCorrect: boolean }[];
  };
}

interface ExamQuestionListProps {
  examId: string;
  examQuestions: ExamQuestion[];
}

const difficultyStyles: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-red-100 text-red-700',
};

export function ExamQuestionList({ examId, examQuestions }: ExamQuestionListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPointsId, setEditingPointsId] = useState<string | null>(null);
  const [pointsValue, setPointsValue] = useState('');
  const [performanceModalId, setPerformanceModalId] = useState<string | null>(null);

  if (examQuestions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No questions added yet. Click "Add Questions" to get started.
      </div>
    );
  }

  const handleRemove = async (examQuestionId: string) => {
    if (!confirm('Remove this question from the exam?')) return;

    setDeletingId(examQuestionId);

    try {
      const response = await fetch(
        `/api/exams/${examId}/questions/${examQuestionId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove question');
      }

      router.refresh();
    } catch (error) {
      alert('Failed to remove question');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdatePoints = async (examQuestionId: string) => {
    try {
      const response = await fetch(
        `/api/exams/${examId}/questions/${examQuestionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pointsAssigned: pointsValue || null }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update points');
      }

      setEditingPointsId(null);
      router.refresh();
    } catch (error) {
      alert('Failed to update points');
    }
  };

  const selectedExamQuestion = examQuestions.find((eq) => eq.id === performanceModalId);

  return (
    <>
      <div className="divide-y divide-gray-100">
        {examQuestions.map((eq, index) => (
          <div key={eq.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              {/* Drag handle and number */}
              <div className="flex items-center gap-2 text-gray-400 pt-1">
                <GripVertical className="h-5 w-5 cursor-grab" />
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                  {index + 1}
                </span>
              </div>

              {/* Question content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {eq.question.topic && (
                    <span className="text-xs text-gray-500">
                      {eq.question.topic.name}
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      difficultyStyles[eq.question.difficulty]
                    }`}
                  >
                    {eq.question.difficulty.toLowerCase()}
                  </span>
                </div>

                <div className="text-sm text-gray-900 line-clamp-2">
                  <LaTeXPreview content={eq.question.questionLatex.substring(0, 200)} />
                </div>

                {/* MC options preview */}
                {eq.question.questionType === 'MULTIPLE_CHOICE' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {eq.question.options.map((opt) => (
                      <span
                        key={opt.label}
                        className={`text-xs px-2 py-0.5 rounded ${
                          opt.isCorrect
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        ({opt.label})
                      </span>
                    ))}
                  </div>
                )}

                {/* Performance data if available */}
                {eq.averageScore !== null && (
                  <div className="mt-2 text-xs text-gray-500">
                    Avg: {Number(eq.averageScore).toFixed(1)}
                    {eq.stdDeviation !== null && (
                      <> (SD: {Number(eq.stdDeviation).toFixed(1)})</>
                    )}
                  </div>
                )}
              </div>

              {/* Points */}
              <div className="flex items-center gap-2">
                {editingPointsId === eq.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={pointsValue}
                      onChange={(e) => setPointsValue(e.target.value)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdatePoints(eq.id);
                        if (e.key === 'Escape') setEditingPointsId(null);
                      }}
                    />
                    <button
                      onClick={() => handleUpdatePoints(eq.id)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingPointsId(eq.id);
                      setPointsValue(eq.pointsAssigned?.toString() || '');
                    }}
                    className="px-2 py-1 text-sm font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    {eq.pointsAssigned ? `${eq.pointsAssigned} pts` : 'Set pts'}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPerformanceModalId(eq.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Enter performance data"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <Link
                  href={`/dashboard/questions/${eq.question.id}`}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="View question"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleRemove(eq.id)}
                  disabled={deletingId === eq.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove from exam"
                >
                  {deletingId === eq.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Modal */}
      {selectedExamQuestion && (
        <PerformanceModal
          examId={examId}
          examQuestion={selectedExamQuestion}
          onClose={() => setPerformanceModalId(null)}
        />
      )}
    </>
  );
}
