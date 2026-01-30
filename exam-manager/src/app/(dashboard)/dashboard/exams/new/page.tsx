import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { ExamForm } from '@/components/exams/exam-form';

interface PageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function NewExamPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const [courses, examTypes] = await Promise.all([
    prisma.course.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.examType.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <ExamForm
      courses={courses}
      examTypes={examTypes}
      initialCourseId={params.course}
    />
  );
}
