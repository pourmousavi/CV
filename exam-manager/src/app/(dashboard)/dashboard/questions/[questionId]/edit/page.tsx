import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { QuestionForm } from '@/components/questions/question-form';

interface PageProps {
  params: Promise<{ questionId: string }>;
}

export default async function EditQuestionPage({ params }: PageProps) {
  const user = await requireUser();
  const { questionId } = await params;

  // Fetch question and form data in parallel
  const [question, courses, tags] = await Promise.all([
    prisma.question.findFirst({
      where: {
        id: questionId,
        userId: user.id,
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.course.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, color: true },
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true },
    }),
  ]);

  if (!question) {
    notFound();
  }

  // Transform question data for the form
  const initialData = {
    id: question.id,
    courseId: question.courseId,
    topicId: question.topicId,
    questionType: question.questionType,
    difficulty: question.difficulty,
    questionLatex: question.questionLatex,
    solutionLatex: question.solutionLatex,
    answerKey: question.answerKey,
    defaultPoints: question.defaultPoints ? Number(question.defaultPoints) : null,
    notes: question.notes,
    sourceReference: question.sourceReference,
    options: question.options.map((opt) => ({
      label: opt.label,
      optionLatex: opt.optionLatex,
      isCorrect: opt.isCorrect,
    })),
    tags: question.tags,
  };

  return <QuestionForm courses={courses} tags={tags} initialData={initialData} />;
}
