import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { QuestionForm } from '@/components/questions/question-form';

interface PageProps {
  searchParams: Promise<{ course?: string; topic?: string }>;
}

export default async function NewQuestionPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  // Fetch courses and tags for the form
  const [courses, tags] = await Promise.all([
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

  return (
    <QuestionForm
      courses={courses}
      tags={tags}
      initialCourseId={params.course}
      initialTopicId={params.topic}
    />
  );
}
