import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { ExamForm } from '@/components/exams/exam-form';

interface PageProps {
  params: Promise<{ examId: string }>;
}

export default async function EditExamPage({ params }: PageProps) {
  const user = await requireUser();
  const { examId } = await params;

  const [exam, courses, examTypes] = await Promise.all([
    prisma.exam.findFirst({
      where: {
        id: examId,
        userId: user.id,
      },
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

  if (!exam) {
    notFound();
  }

  return (
    <ExamForm
      courses={courses}
      examTypes={examTypes}
      initialData={exam}
    />
  );
}
